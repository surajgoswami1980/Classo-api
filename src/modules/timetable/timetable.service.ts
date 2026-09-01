import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TimetablePeriodEntity } from '../../entities/timetable-period.entity';
import { StudentEntity } from '../../entities/student.entity';

@Injectable()
export class TimetableService {
  constructor(
    @InjectRepository(TimetablePeriodEntity)
    private timetableRepo: Repository<TimetablePeriodEntity>,
    @InjectRepository(StudentEntity)
    private studentRepo: Repository<StudentEntity>,
  ) {}

  /**
   * Get timetable for a class/section (used by teachers and admin)
   */
  async getClassTimetable(schoolId: number, classId: number, sectionId: number) {
    const periods = await this.timetableRepo
      .createQueryBuilder('t')
      .leftJoin('subjects', 's', 's.id = t.subject_id')
      .leftJoin('users', 'u', 'u.id = t.teacher_id')
      .addSelect('s.name', 'subject_name')
      .addSelect('u.name', 'teacher_name')
      .where('t.school_id = :schoolId', { schoolId })
      .andWhere('t.class_id = :classId', { classId })
      .andWhere('t.section_id = :sectionId', { sectionId })
      .orderBy('t.day_of_week', 'ASC')
      .addOrderBy('t.period_number', 'ASC')
      .getRawMany();

    return periods.map((p) => ({
      id: p.t_id,
      day_of_week: p.t_day_of_week,
      period_number: p.t_period_number,
      start_time: p.t_start_time,
      end_time: p.t_end_time,
      subject_name: p.subject_name,
      teacher_name: p.teacher_name,
      subject_id: p.t_subject_id,
      teacher_id: p.t_teacher_id,
    }));
  }

  /**
   * Get today's timetable for a student (based on their class/section)
   */
  async getStudentTodayTimetable(schoolId: number, userId: number) {
    const student = await this.studentRepo.findOne({
      where: { school_id: schoolId, user_id: userId, status: 'active' },
    });
    if (!student) return [];

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];

    if (today === 'sunday') return [];

    const periods = await this.timetableRepo
      .createQueryBuilder('t')
      .leftJoin('subjects', 's', 's.id = t.subject_id')
      .leftJoin('users', 'u', 'u.id = t.teacher_id')
      .addSelect('s.name', 'subject_name')
      .addSelect('u.name', 'teacher_name')
      .where('t.school_id = :schoolId', { schoolId })
      .andWhere('t.class_id = :classId', { classId: student.class_id })
      .andWhere('t.section_id = :sectionId', { sectionId: student.section_id })
      .andWhere('t.day_of_week = :day', { day: today })
      .orderBy('t.period_number', 'ASC')
      .getRawMany();

    return periods.map((p) => ({
      period_number: p.t_period_number,
      subject_name: p.subject_name,
      teacher_name: p.teacher_name,
      start_time: p.t_start_time,
      end_time: p.t_end_time,
    }));
  }

  /**
   * Get full week timetable for a student
   */
  async getStudentWeekTimetable(schoolId: number, userId: number) {
    const student = await this.studentRepo.findOne({
      where: { school_id: schoolId, user_id: userId, status: 'active' },
    });
    if (!student) return [];

    return this.getClassTimetable(schoolId, student.class_id, student.section_id);
  }
}
