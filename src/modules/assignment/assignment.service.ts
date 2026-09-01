import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignmentEntity } from '../../entities/assignment.entity';
import { StudentEntity } from '../../entities/student.entity';

@Injectable()
export class AssignmentService {
  constructor(
    @InjectRepository(AssignmentEntity)
    private assignmentRepo: Repository<AssignmentEntity>,
    @InjectRepository(StudentEntity)
    private studentRepo: Repository<StudentEntity>,
  ) {}

  /**
   * Create assignment (teacher)
   */
  async createAssignment(schoolId: number, teacherId: number, data: {
    class_id: number;
    section_id: number;
    subject_id: number;
    title: string;
    description?: string;
    due_date: string;
    max_marks?: number;
    attachment_url?: string;
    attachment_type?: string;
  }) {
    const assignment = this.assignmentRepo.create({
      school_id: schoolId,
      teacher_id: teacherId,
      class_id: data.class_id,
      section_id: data.section_id,
      subject_id: data.subject_id,
      title: data.title,
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

  /**
   * List assignments for teacher (their own)
   */
  async listTeacherAssignments(schoolId: number, teacherId: number, query?: { class_id?: number; section_id?: number }) {
    const qb = this.assignmentRepo
      .createQueryBuilder('a')
      .where('a.school_id = :schoolId', { schoolId })
      .andWhere('a.teacher_id = :teacherId', { teacherId });

    if (query?.class_id) qb.andWhere('a.class_id = :classId', { classId: query.class_id });
    if (query?.section_id) qb.andWhere('a.section_id = :sectionId', { sectionId: query.section_id });

    const assignments = await qb.orderBy('a.created_at', 'DESC').getMany();

    return assignments.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      class_id: a.class_id,
      section_id: a.section_id,
      subject_id: a.subject_id,
      due_date: a.due_date,
      max_marks: a.max_marks,
      status: a.status,
      created_at: a.created_at,
    }));
  }

  /**
   * List assignments for student (by their class/section)
   */
  async listStudentAssignments(schoolId: number, userId: number) {
    // Find student's class and section
    const student = await this.studentRepo.findOne({
      where: { school_id: schoolId, user_id: userId, status: 'active' },
    });

    if (!student) {
      return [];
    }

    const assignments = await this.assignmentRepo.find({
      where: {
        school_id: schoolId,
        class_id: student.class_id,
        section_id: student.section_id,
        status: 'published',
      },
      order: { due_date: 'DESC' },
    });

    return assignments.map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      subject_id: a.subject_id,
      due_date: a.due_date,
      max_marks: a.max_marks,
      attachment_url: a.attachment_url,
      created_at: a.created_at,
    }));
  }

  /**
   * Get single assignment detail
   */
  async getAssignment(schoolId: number, assignmentId: number) {
    const assignment = await this.assignmentRepo.findOne({
      where: { id: assignmentId, school_id: schoolId },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    return assignment;
  }

  /**
   * Delete assignment (teacher can only delete their own)
   */
  async deleteAssignment(schoolId: number, assignmentId: number, teacherId: number) {
    const assignment = await this.assignmentRepo.findOne({
      where: { id: assignmentId, school_id: schoolId },
    });
    if (!assignment) throw new NotFoundException('Assignment not found');
    if (assignment.teacher_id !== teacherId) {
      throw new ForbiddenException('You can only delete your own assignments');
    }
    await this.assignmentRepo.remove(assignment);
    return { message: 'Assignment deleted' };
  }
}
