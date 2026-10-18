import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AssignmentEntity } from '../../entities/assignment.entity';
import { AssignmentSubmissionEntity } from '../../entities/assignment-submission.entity';
import { StudentEntity } from '../../entities/student.entity';

@Injectable()
export class AssignmentService {
  constructor(
    @InjectRepository(AssignmentEntity)
    private assignmentRepo: Repository<AssignmentEntity>,
    @InjectRepository(AssignmentSubmissionEntity)
    private submissionRepo: Repository<AssignmentSubmissionEntity>,
    @InjectRepository(StudentEntity)
    private studentRepo: Repository<StudentEntity>,
    private dataSource: DataSource,
  ) {}

  // ─── Create / list / delete (teacher-admin) ────────────────────────────

  async createAssignment(schoolId: number, teacherId: number, data: any) {
    const assignment = this.assignmentRepo.create({
      school_id: schoolId,
      teacher_id: teacherId,
      class_id: data.class_id,
      section_id: data.section_id,
      subject_id: data.subject_id,
      title: data.title,
      topic: data.topic || null,
      description: data.description || null,
      due_date: new Date(data.due_date),
      max_marks: data.max_marks || 100,
      attachment_url: data.attachment_url || null,
      attachment_type: data.attachment_type || null,
      status: 'published',
    });
    const saved = await this.assignmentRepo.save(assignment);
    return { id: saved.id, message: 'Assignment created successfully' };
  }

  async listTeacherAssignments(schoolId: number, teacherId: number, query?: { class_id?: number; section_id?: number }) {
    const qb = this.assignmentRepo
      .createQueryBuilder('a')
      .where('a.school_id = :schoolId', { schoolId });

    if (query?.class_id) qb.andWhere('a.class_id = :classId', { classId: query.class_id });
    if (query?.section_id) qb.andWhere('a.section_id = :sectionId', { sectionId: query.section_id });

    const assignments = await qb.orderBy('a.created_at', 'DESC').getMany();

    // Attach submission counts so the teacher sees progress at a glance.
    const result = [];
    for (const a of assignments) {
      const counts = await this.submissionRepo
        .createQueryBuilder('s')
        .select('s.status', 'status')
        .addSelect('COUNT(*)', 'count')
        .where('s.assignment_id = :id', { id: a.id })
        .groupBy('s.status')
        .getRawMany();
      const byStatus: Record<string, number> = {};
      counts.forEach((c) => (byStatus[c.status] = Number(c.count)));
      const totalStudents = await this.studentRepo.count({
        where: { school_id: schoolId, class_id: a.class_id, section_id: a.section_id, status: 'active' as any },
      });
      result.push({
        id: a.id,
        title: a.title,
        topic: a.topic,
        description: a.description,
        class_id: a.class_id,
        section_id: a.section_id,
        subject_id: a.subject_id,
        due_date: a.due_date,
        max_marks: a.max_marks,
        status: a.status,
        attachment_url: a.attachment_url,
        attachment_type: a.attachment_type,
        created_at: a.created_at,
        submitted_count: byStatus['submitted'] || 0,
        graded_count: byStatus['graded'] || 0,
        missed_count: byStatus['missed'] || 0,
        total_students: totalStudents,
      });
    }
    return result;
  }

  async getAssignment(schoolId: number, assignmentId: number) {
    const assignment = await this.assignmentRepo.findOne({ where: { id: assignmentId, school_id: schoolId } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    return assignment;
  }

  async deleteAssignment(schoolId: number, assignmentId: number, teacherId: number) {
    const assignment = await this.assignmentRepo.findOne({ where: { id: assignmentId, school_id: schoolId } });
    if (!assignment) throw new NotFoundException('Assignment not found');
    await this.submissionRepo.delete({ assignment_id: assignmentId });
    await this.assignmentRepo.remove(assignment);
    return { message: 'Assignment deleted' };
  }

  // ─── Student side ───────────────────────────────────────────────────────

  private async resolveStudent(schoolId: number, userId: number) {
    const student = await this.studentRepo.findOne({
      where: { school_id: schoolId, user_id: userId, status: 'active' as any },
    });
    if (!student) throw new NotFoundException('Student profile not found');
    return student;
  }

  /** Assignments for a student's class/section, each with their own submission status. */
  async listStudentAssignments(schoolId: number, userId: number) {
    const student = await this.studentRepo.findOne({
      where: { school_id: schoolId, user_id: userId, status: 'active' as any },
    });
    if (!student) return [];

    const assignments = await this.assignmentRepo.find({
      where: { school_id: schoolId, class_id: student.class_id, section_id: student.section_id, status: 'published' },
      order: { due_date: 'DESC' },
    });

    const submissions = await this.submissionRepo.find({ where: { student_id: student.id } });
    const subMap = new Map(submissions.map((s) => [s.assignment_id, s]));
    const now = Date.now();

    return assignments.map((a) => {
      const sub = subMap.get(a.id);
      const overdue = new Date(a.due_date).getTime() < now;
      let status = sub?.status || 'pending';
      if (status === 'pending' && overdue) status = 'missed';
      return {
        id: a.id,
        title: a.title,
        topic: a.topic,
        description: a.description,
        subject_id: a.subject_id,
        due_date: a.due_date,
        max_marks: a.max_marks,
        attachment_url: a.attachment_url,
        attachment_type: a.attachment_type,
        created_at: a.created_at,
        overdue,
        submission: sub
          ? {
              id: sub.id,
              status: sub.status,
              description: sub.description,
              attachment_url: sub.attachment_url,
              attachment_type: sub.attachment_type,
              submitted_at: sub.submitted_at,
              is_late: sub.is_late,
              marks: sub.marks,
              feedback: sub.feedback,
            }
          : null,
        effective_status: status,
      };
    });
  }

  /** Student submits (or re-submits before due date) text + optional attachment. */
  async submitAssignment(schoolId: number, userId: number, assignmentId: number, data: { description?: string; attachment_url?: string; attachment_type?: string }) {
    const assignment = await this.assignmentRepo.findOne({ where: { id: assignmentId, school_id: schoolId } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    const student = await this.resolveStudent(schoolId, userId);

    if (!data.description && !data.attachment_url) {
      throw new BadRequestException('Add a description or attach a file to submit.');
    }

    const now = new Date();
    const isLate = now.getTime() > new Date(assignment.due_date).getTime();

    let sub = await this.submissionRepo.findOne({ where: { assignment_id: assignmentId, student_id: student.id } });
    if (sub && sub.status === 'graded') {
      throw new ForbiddenException('This assignment has already been graded and cannot be resubmitted.');
    }

    if (!sub) {
      sub = this.submissionRepo.create({
        school_id: schoolId,
        assignment_id: assignmentId,
        student_id: student.id,
        user_id: userId,
      });
    }
    sub.description = data.description || null;
    sub.attachment_url = data.attachment_url || null;
    sub.attachment_type = data.attachment_type || null;
    sub.status = 'submitted';
    sub.submitted_at = now;
    sub.is_late = isLate;

    await this.submissionRepo.save(sub);
    return { id: sub.id, is_late: isLate, message: 'Assignment submitted' };
  }

  // ─── Teacher/admin grading ──────────────────────────────────────────────

  /** All students in the assignment's class/section merged with submission + marks. */
  async listSubmissions(schoolId: number, assignmentId: number) {
    const assignment = await this.assignmentRepo.findOne({ where: { id: assignmentId, school_id: schoolId } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    // Auto-finalize missed submissions if the due date passed.
    await this.autoMarkMissed(assignment);

    const rows = await this.dataSource.query(
      `SELECT st.id as student_id, u.name as student_name, st.roll_number,
              sub.id as submission_id, sub.status, sub.description, sub.attachment_url,
              sub.attachment_type, sub.submitted_at, sub.is_late, sub.marks, sub.feedback
       FROM students st
       JOIN users u ON u.id = st.user_id
       LEFT JOIN assignment_submissions sub
              ON sub.assignment_id = ? AND sub.student_id = st.id
       WHERE st.school_id = ? AND st.class_id = ? AND st.section_id = ? AND st.status = 'active'
       ORDER BY st.roll_number`,
      [assignmentId, schoolId, assignment.class_id, assignment.section_id],
    );

    return {
      assignment: {
        id: assignment.id,
        title: assignment.title,
        topic: assignment.topic,
        max_marks: assignment.max_marks,
        due_date: assignment.due_date,
      },
      submissions: rows.map((r: any) => ({
        student_id: r.student_id,
        student_name: r.student_name,
        roll_number: r.roll_number,
        submission_id: r.submission_id,
        status: r.status || 'pending',
        description: r.description,
        attachment_url: r.attachment_url,
        attachment_type: r.attachment_type,
        submitted_at: r.submitted_at,
        is_late: !!r.is_late,
        marks: r.marks,
        feedback: r.feedback,
      })),
    };
  }

  /** Teacher/admin awards marks + feedback to a student's submission. */
  async gradeSubmission(schoolId: number, graderId: number, assignmentId: number, studentId: number, data: { marks: number; feedback?: string }) {
    const assignment = await this.assignmentRepo.findOne({ where: { id: assignmentId, school_id: schoolId } });
    if (!assignment) throw new NotFoundException('Assignment not found');

    if (data.marks == null || data.marks < 0 || data.marks > assignment.max_marks) {
      throw new BadRequestException(`Marks must be between 0 and ${assignment.max_marks}.`);
    }

    let sub = await this.submissionRepo.findOne({ where: { assignment_id: assignmentId, student_id: studentId } });
    if (!sub) {
      // Grading a student who never submitted (e.g. awarding 0).
      sub = this.submissionRepo.create({
        school_id: schoolId,
        assignment_id: assignmentId,
        student_id: studentId,
        status: 'missed',
      });
    }
    sub.marks = data.marks;
    sub.feedback = data.feedback || null;
    sub.status = 'graded';
    sub.graded_by = graderId;
    sub.graded_at = new Date();
    await this.submissionRepo.save(sub);
    return { message: 'Marks saved' };
  }

  /**
   * After the due date, every active student without a submission is recorded
   * as 'missed' with 0 marks so the record for each student is complete.
   */
  async autoMarkMissed(assignment: AssignmentEntity) {
    if (new Date(assignment.due_date).getTime() >= Date.now()) return;

    await this.dataSource.query(
      `INSERT INTO assignment_submissions
         (school_id, assignment_id, student_id, status, marks, created_at, updated_at)
       SELECT ?, ?, st.id, 'missed', 0, NOW(), NOW()
       FROM students st
       WHERE st.school_id = ? AND st.class_id = ? AND st.section_id = ? AND st.status = 'active'
         AND NOT EXISTS (
           SELECT 1 FROM assignment_submissions s
           WHERE s.assignment_id = ? AND s.student_id = st.id
         )`,
      [
        assignment.school_id, assignment.id,
        assignment.school_id, assignment.class_id, assignment.section_id,
        assignment.id,
      ],
    );
  }
}
