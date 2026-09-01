import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ExamEntity } from '../../entities/exam.entity';
import { StudentMarksEntity } from '../../entities/student-marks.entity';
import { StudentEntity } from '../../entities/student.entity';
import { SubjectEntity } from '../../entities/subject.entity';
import { RedisService } from '../../common/providers/redis.service';

@Injectable()
export class ExamService {
  constructor(
    @InjectRepository(ExamEntity) private examRepo: Repository<ExamEntity>,
    @InjectRepository(StudentMarksEntity) private marksRepo: Repository<StudentMarksEntity>,
    @InjectRepository(StudentEntity) private studentRepo: Repository<StudentEntity>,
    @InjectRepository(SubjectEntity) private subjectRepo: Repository<SubjectEntity>,
    private redis: RedisService,
  ) {}

  /**
   * Create a new exam
   */
  async createExam(schoolId: number, dto: CreateExamDto) {
    const exam = this.examRepo.create({
      school_id: schoolId,
      academic_session_id: dto.academic_session_id,
      name: dto.name,
      exam_type: dto.exam_type,
      start_date: dto.start_date,
      end_date: dto.end_date,
    });
    return this.examRepo.save(exam);
  }

  /**
   * List the subjects configured for an exam+class — drives the subject
   * dropdown on the marks-entry page, which needs an exam_subject_id
   * before it can call marks/entry-data or marks/enter.
   */
  async getExamSubjects(schoolId: number, examId: number, classId: number) {
    return this.subjectRepo.query(
      `SELECT es.id as id, es.subject_id, sub.name as subject_name,
              es.max_marks, es.passing_marks
       FROM exam_subjects es
       JOIN subjects sub ON sub.id = es.subject_id
       WHERE es.school_id = ? AND es.exam_id = ? AND es.class_id = ?
       ORDER BY sub.name`,
      [schoolId, examId, classId],
    );
  }

  /**
   * List exams for a school
   */
  async listExams(schoolId: number, sessionId?: number) {
    const query = this.examRepo.createQueryBuilder('e')
      .where('e.school_id = :schoolId', { schoolId })
      .orderBy('e.created_at', 'DESC');

    if (sessionId) {
      query.andWhere('e.academic_session_id = :sessionId', { sessionId });
    }

    return query.getMany();
  }

  /**
   * Get marks entry page data — students + existing marks for a subject in an exam
   */
  async getMarksEntryData(schoolId: number, examId: number, examSubjectId: number, classId: number, sectionId: number) {
    // Get students in class/section
    const students = await this.studentRepo.find({
      where: { school_id: schoolId, class_id: classId, section_id: sectionId, status: 'active' },
      relations: ['user'],
      order: { roll_number: 'ASC' },
    });

    // Get existing marks
    const existingMarks = await this.marksRepo.find({
      where: { school_id: schoolId, exam_id: examId, exam_subject_id: examSubjectId },
    });

    const marksMap = new Map(existingMarks.map(m => [m.student_id, m]));

    return {
      students: students.map(s => ({
        student_id: s.id,
        roll_number: s.roll_number,
        name: s.user?.name || '',
        marks_obtained: marksMap.get(s.id)?.marks_obtained ?? null,
        grade: marksMap.get(s.id)?.grade ?? null,
        remarks: marksMap.get(s.id)?.remarks ?? null,
      })),
      total_students: students.length,
      marks_entered: existingMarks.length,
    };
  }

  /**
   * Enter/Update marks (bulk) — used by teacher or admin
   */
  async enterMarks(schoolId: number, dto: EnterMarksDto, enteredBy: number) {
    const { exam_id, exam_subject_id, max_marks, marks } = dto;

    // Validate marks don't exceed max
    const invalidMarks = marks.filter(m => m.marks_obtained > max_marks);
    if (invalidMarks.length > 0) {
      throw new BadRequestException(
        `Marks cannot exceed ${max_marks}. Invalid entries for students: ${invalidMarks.map(m => m.student_id).join(', ')}`,
      );
    }

    const results: StudentMarksEntity[] = [];
    for (const item of marks) {
      // Calculate grade automatically
      const percentage = (item.marks_obtained / max_marks) * 100;
      const grade = this.calculateGrade(percentage);

      const existing = await this.marksRepo.findOne({
        where: { school_id: schoolId, student_id: item.student_id, exam_subject_id },
      });

      if (existing) {
        existing.marks_obtained = item.marks_obtained;
        existing.grade = grade;
        existing.remarks = item.remarks || existing.remarks;
        existing.entered_by = enteredBy;
        results.push(await this.marksRepo.save(existing));
      } else {
        const record = this.marksRepo.create({
          school_id: schoolId,
          exam_id,
          exam_subject_id,
          student_id: item.student_id,
          marks_obtained: item.marks_obtained,
          grade,
          remarks: item.remarks,
          entered_by: enteredBy,
        });
        results.push(await this.marksRepo.save(record));
      }
    }

    // Invalidate cached report cards
    await this.redis.delPattern(`report_card:${schoolId}:${exam_id}:*`);

    return {
      message: `Marks entered for ${results.length} students`,
      exam_id,
      exam_subject_id,
    };
  }

  /**
   * Get full report card for a student — all subjects in an exam
   */
  async getReportCard(schoolId: number, studentId: number, examId: number) {
    const cacheKey = `report_card:${schoolId}:${examId}:${studentId}`;
    const cached = await this.redis.getJson(cacheKey);
    if (cached) return cached;

    // Get student info
    const student = await this.studentRepo.findOne({
      where: { id: studentId, school_id: schoolId },
      relations: ['user'],
    });
    if (!student) throw new NotFoundException('Student not found');

    // Get exam info
    const exam = await this.examRepo.findOne({ where: { id: examId, school_id: schoolId } });
    if (!exam) throw new NotFoundException('Exam not found');

    // Get all marks for this student in this exam
    const marks = await this.marksRepo
      .createQueryBuilder('m')
      .where('m.school_id = :schoolId', { schoolId })
      .andWhere('m.exam_id = :examId', { examId })
      .andWhere('m.student_id = :studentId', { studentId })
      .getMany();

    // Get exam subjects with subject details
    const examSubjects = await this.marksRepo.query(`
      SELECT es.id as exam_subject_id, es.max_marks, es.passing_marks, es.exam_date,
             s.name as subject_name, s.code as subject_code
      FROM exam_subjects es
      JOIN subjects s ON s.id = es.subject_id
      WHERE es.school_id = ? AND es.exam_id = ?
      ORDER BY s.name
    `, [schoolId, examId]);

    // Build subject-wise marks. Both sides are coerced to Number: MySQL
    // DECIMAL columns come back as strings from both raw queries (mysql2)
    // and TypeORM's own repo (no transformer on these entities), which
    // previously broke the Map lookup (string vs number keys — marks
    // never matched) and turned the running totals into string
    // concatenation instead of arithmetic.
    const marksMap = new Map(marks.map(m => [Number(m.exam_subject_id), m]));
    let totalObtained = 0;
    let totalMax = 0;
    let totalPassed = true;

    const subjectResults = examSubjects.map((es: any) => {
      const mark = marksMap.get(Number(es.exam_subject_id));
      const maxMarks = Number(es.max_marks);
      const passingMarks = Number(es.passing_marks);
      const obtained = mark ? Number(mark.marks_obtained) : 0;
      const passed = obtained >= passingMarks;
      totalObtained += obtained;
      totalMax += maxMarks;
      if (!passed && mark) totalPassed = false;

      return {
        subject_name: es.subject_name,
        subject_code: es.subject_code,
        max_marks: maxMarks,
        passing_marks: passingMarks,
        marks_obtained: mark ? obtained : null,
        grade: mark?.grade ?? '-',
        passed,
        exam_date: es.exam_date,
      };
    });

    const totalPercentage = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100 * 100) / 100 : 0;

    // Calculate rank among classmates
    const classRank = await this.calculateRank(schoolId, examId, student.class_id, student.section_id, studentId);

    // Get class average
    const classAvg = await this.getClassAverage(schoolId, examId, student.class_id, student.section_id);

    const reportCard = {
      student: {
        id: student.id,
        name: student.user?.name || '',
        roll_number: student.roll_number,
        admission_number: student.admission_number,
        class_id: student.class_id,
        section_id: student.section_id,
      },
      exam: {
        id: exam.id,
        name: exam.name,
        exam_type: exam.exam_type,
      },
      subjects: subjectResults,
      summary: {
        total_marks_obtained: totalObtained,
        total_max_marks: totalMax,
        percentage: totalPercentage,
        overall_grade: this.calculateGrade(totalPercentage),
        result: totalPassed ? 'PASS' : 'FAIL',
        rank: classRank,
        class_average: classAvg,
      },
    };

    // Cache for 15 minutes
    await this.redis.setJson(cacheKey, reportCard, 900);

    return reportCard;
  }

  /**
   * Calculate rank within class/section
   */
  private async calculateRank(schoolId: number, examId: number, classId: number, sectionId: number, studentId: number): Promise<number> {
    const results = await this.marksRepo.query(`
      SELECT m.student_id, SUM(m.marks_obtained) as total
      FROM student_marks m
      JOIN students s ON s.id = m.student_id
      WHERE m.school_id = ? AND m.exam_id = ? AND s.class_id = ? AND s.section_id = ?
      GROUP BY m.student_id
      ORDER BY total DESC
    `, [schoolId, examId, classId, sectionId]);

    const rank = results.findIndex((r: any) => Number(r.student_id) === Number(studentId)) + 1;
    return rank || 0;
  }

  /**
   * Get class average percentage
   */
  private async getClassAverage(schoolId: number, examId: number, classId: number, sectionId: number): Promise<number> {
    const result = await this.marksRepo.query(`
      SELECT AVG(student_total) as avg_percentage FROM (
        SELECT m.student_id, 
               (SUM(m.marks_obtained) / SUM(es.max_marks)) * 100 as student_total
        FROM student_marks m
        JOIN exam_subjects es ON es.id = m.exam_subject_id
        JOIN students s ON s.id = m.student_id
        WHERE m.school_id = ? AND m.exam_id = ? AND s.class_id = ? AND s.section_id = ?
        GROUP BY m.student_id
      ) totals
    `, [schoolId, examId, classId, sectionId]);

    return Math.round((result[0]?.avg_percentage || 0) * 100) / 100;
  }

  /**
   * Grade calculation (configurable per school later)
   */
  private calculateGrade(percentage: number): string {
    if (percentage >= 91) return 'A+';
    if (percentage >= 81) return 'A';
    if (percentage >= 71) return 'B+';
    if (percentage >= 61) return 'B';
    if (percentage >= 51) return 'C+';
    if (percentage >= 41) return 'C';
    if (percentage >= 33) return 'D';
    return 'F';
  }

  /**
   * Publish exam — makes results visible to students/parents
   */
  async publishExam(schoolId: number, examId: number) {
    const exam = await this.examRepo.findOne({ where: { id: examId, school_id: schoolId } });
    if (!exam) throw new NotFoundException('Exam not found');

    exam.is_published = 1;
    await this.examRepo.save(exam);

    return { message: 'Exam results published successfully', exam_id: examId };
  }

  /**
   * Class-wise result analysis
   */
  async getResultAnalysis(schoolId: number, examId: number, classId: number) {
    const results = await this.marksRepo.query(`
      SELECT 
        s.name as subject_name,
        COUNT(DISTINCT m.student_id) as total_students,
        AVG(m.marks_obtained) as avg_marks,
        MAX(m.marks_obtained) as highest,
        MIN(m.marks_obtained) as lowest,
        es.max_marks,
        es.passing_marks,
        SUM(CASE WHEN m.marks_obtained >= es.passing_marks THEN 1 ELSE 0 END) as passed_count
      FROM student_marks m
      JOIN exam_subjects es ON es.id = m.exam_subject_id
      JOIN subjects s ON s.id = es.subject_id
      WHERE m.school_id = ? AND m.exam_id = ? AND es.class_id = ?
      GROUP BY es.id, s.name, es.max_marks, es.passing_marks
      ORDER BY s.name
    `, [schoolId, examId, classId]);

    return results.map((r: any) => ({
      ...r,
      pass_percentage: r.total_students > 0 ? Math.round((r.passed_count / r.total_students) * 100) : 0,
      avg_percentage: r.max_marks > 0 ? Math.round((r.avg_marks / r.max_marks) * 100) : 0,
    }));
  }
}

// ─── DTOs ──────────────────────────────────────────────────────

export class CreateExamDto {
  academic_session_id: number;
  name: string;
  exam_type: string;
  start_date?: string;
  end_date?: string;
}

export class EnterMarksDto {
  exam_id: number;
  exam_subject_id: number;
  max_marks: number;
  marks: { student_id: number; marks_obtained: number; remarks?: string }[];
}
