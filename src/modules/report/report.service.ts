import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentEntity } from '../../entities/student.entity';
import { ExamEntity } from '../../entities/exam.entity';

@Injectable()
export class ReportService {
  constructor(
    @InjectRepository(StudentEntity) private studentRepo: Repository<StudentEntity>,
    @InjectRepository(ExamEntity) private examRepo: Repository<ExamEntity>,
  ) {}

  /**
   * Attendance report over a date range, broken down by class/section,
   * with an overall summary.
   */
  async getAttendanceReport(schoolId: number, fromDate: string, toDate: string, classId?: number, sectionId?: number) {
    const byClass = await this.studentRepo.query(
      `SELECT c.name as class_name, sec.name as section_name,
              SUM(CASE WHEN sa.status = 'present' THEN 1 ELSE 0 END) as present_count,
              SUM(CASE WHEN sa.status = 'absent' THEN 1 ELSE 0 END) as absent_count,
              SUM(CASE WHEN sa.status = 'late' THEN 1 ELSE 0 END) as late_count,
              COUNT(*) as total_marked
       FROM student_attendance sa
       JOIN classes c ON c.id = sa.class_id
       JOIN sections sec ON sec.id = sa.section_id
       WHERE sa.school_id = ? AND sa.date BETWEEN ? AND ?
         ${classId ? 'AND sa.class_id = ?' : ''}
         ${sectionId ? 'AND sa.section_id = ?' : ''}
       GROUP BY sa.class_id, sa.section_id, c.name, sec.name
       ORDER BY c.numeric_order, sec.name`,
      [schoolId, fromDate, toDate, ...(classId ? [classId] : []), ...(sectionId ? [sectionId] : [])],
    );

    const totals = byClass.reduce(
      (acc: any, r: any) => ({
        present: acc.present + Number(r.present_count),
        absent: acc.absent + Number(r.absent_count),
        late: acc.late + Number(r.late_count),
        total: acc.total + Number(r.total_marked),
      }),
      { present: 0, absent: 0, late: 0, total: 0 },
    );

    return {
      by_class: byClass,
      summary: {
        ...totals,
        attendance_percentage: totals.total > 0 ? Math.round((totals.present / totals.total) * 100) : 0,
      },
    };
  }

  /**
   * Fee collection totals per class and overall — collected, pending,
   * overdue amounts, matching the school-wide financial reporting
   * requirement (distinct from fee/collection-report's day-by-day view).
   */
  async getFeeCollectionReport(schoolId: number, fromDate: string, toDate: string) {
    const byClass = await this.studentRepo.query(
      `SELECT c.name as class_name,
              SUM(CASE WHEN i.status = 'paid' THEN i.total_amount ELSE 0 END) as collected,
              SUM(CASE WHEN i.status IN ('pending', 'partial') THEN i.total_amount ELSE 0 END) as pending,
              SUM(CASE WHEN i.status = 'overdue' THEN i.total_amount ELSE 0 END) as overdue
       FROM fee_invoices i
       JOIN students s ON s.id = i.student_id
       JOIN classes c ON c.id = s.class_id
       WHERE i.school_id = ? AND i.created_at BETWEEN ? AND ?
       GROUP BY s.class_id, c.name
       ORDER BY c.numeric_order`,
      [schoolId, fromDate, toDate],
    );

    const totals = byClass.reduce(
      (acc: any, r: any) => ({
        collected: acc.collected + Number(r.collected),
        pending: acc.pending + Number(r.pending),
        overdue: acc.overdue + Number(r.overdue),
      }),
      { collected: 0, pending: 0, overdue: 0 },
    );

    return { by_class: byClass, summary: totals };
  }

  /**
   * Class-wise and subject-wise result analysis for an exam: pass
   * percentage, average marks, and highest/lowest scores per subject.
   */
  async getExamPerformanceReport(schoolId: number, examId: number) {
    const exam = await this.examRepo.findOne({ where: { id: examId, school_id: schoolId } });
    if (!exam) throw new NotFoundException('Exam not found');

    const bySubject = await this.studentRepo.query(
      `SELECT sub.name as subject_name, es.max_marks, es.passing_marks,
              COUNT(sm.id) as attempted,
              SUM(CASE WHEN sm.marks_obtained >= es.passing_marks THEN 1 ELSE 0 END) as passed,
              ROUND(AVG(sm.marks_obtained), 2) as average_marks,
              MAX(sm.marks_obtained) as highest_marks,
              MIN(sm.marks_obtained) as lowest_marks
       FROM exam_subjects es
       JOIN subjects sub ON sub.id = es.subject_id
       LEFT JOIN student_marks sm ON sm.exam_subject_id = es.id AND sm.school_id = ?
       WHERE es.school_id = ? AND es.exam_id = ?
       GROUP BY es.id, sub.name, es.max_marks, es.passing_marks
       ORDER BY sub.name`,
      [schoolId, schoolId, examId],
    );

    return {
      exam: { id: exam.id, name: exam.name, exam_type: exam.exam_type },
      by_subject: bySubject.map((r: any) => ({
        ...r,
        pass_percentage: Number(r.attempted) > 0 ? Math.round((Number(r.passed) / Number(r.attempted)) * 100) : 0,
      })),
    };
  }

  /**
   * Student strength (headcount) per class/section — a dashboard-style
   * summary of active enrollment.
   */
  async getStudentStrengthReport(schoolId: number) {
    const byClass = await this.studentRepo.query(
      `SELECT c.name as class_name, sec.name as section_name,
              COUNT(*) as student_count,
              SUM(CASE WHEN s.gender = 'male' THEN 1 ELSE 0 END) as male_count,
              SUM(CASE WHEN s.gender = 'female' THEN 1 ELSE 0 END) as female_count
       FROM students s
       JOIN classes c ON c.id = s.class_id
       JOIN sections sec ON sec.id = s.section_id
       WHERE s.school_id = ? AND s.status = 'active'
       GROUP BY s.class_id, s.section_id, c.name, sec.name
       ORDER BY c.numeric_order, sec.name`,
      [schoolId],
    );

    const total = byClass.reduce((sum: number, r: any) => sum + Number(r.student_count), 0);

    return { by_class: byClass, total_students: total };
  }
}
