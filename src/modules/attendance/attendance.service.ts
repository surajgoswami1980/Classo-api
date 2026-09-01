import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { StudentAttendanceEntity } from '../../entities/student-attendance.entity';
import { StaffAttendanceEntity } from '../../entities/staff-attendance.entity';
import { StudentEntity } from '../../entities/student.entity';
import { MarkStudentAttendanceDto, MarkStaffAttendanceDto, AttendanceReportDto } from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(StudentAttendanceEntity)
    private studentAttRepo: Repository<StudentAttendanceEntity>,
    @InjectRepository(StaffAttendanceEntity)
    private staffAttRepo: Repository<StaffAttendanceEntity>,
    @InjectRepository(StudentEntity)
    private studentRepo: Repository<StudentEntity>,
  ) {}

  async markStudentAttendance(schoolId: number, dto: MarkStudentAttendanceDto, markedBy: number) {
    const { class_id, section_id, date, attendance } = dto;

    if (new Date(date) > new Date()) {
      throw new BadRequestException('Cannot mark attendance for a future date');
    }

    const results: StudentAttendanceEntity[] = [];
    for (const item of attendance) {
      const existing = await this.studentAttRepo.findOne({
        where: { school_id: schoolId, student_id: item.student_id, date },
      });

      if (existing) {
        existing.status = item.status;
        existing.remarks = item.remarks || existing.remarks;
        existing.marked_by = markedBy;
        results.push(await this.studentAttRepo.save(existing));
      } else {
        const record = this.studentAttRepo.create({
          school_id: schoolId,
          student_id: item.student_id,
          class_id,
          section_id,
          date,
          status: item.status,
          remarks: item.remarks,
          marked_by: markedBy,
        });
        results.push(await this.studentAttRepo.save(record));
      }
    }

    return {
      message: `Attendance marked for ${results.length} students`,
      date,
      class_id,
      section_id,
      total_present: attendance.filter((a) => a.status === 'present').length,
      total_absent: attendance.filter((a) => a.status === 'absent').length,
      total_late: attendance.filter((a) => a.status === 'late').length,
    };
  }

  async getStudentAttendance(schoolId: number, classId: number, sectionId: number, date: string) {
    const students = await this.studentRepo.find({
      where: { school_id: schoolId, class_id: classId, section_id: sectionId, status: 'active' },
      select: ['id', 'user_id', 'roll_number'],
      relations: ['user'],
      order: { roll_number: 'ASC' },
    });

    const attendance = await this.studentAttRepo.find({
      where: { school_id: schoolId, class_id: classId, section_id: sectionId, date },
    });

    const attendanceMap = new Map(attendance.map((a) => [a.student_id, a]));

    return {
      date,
      class_id: classId,
      section_id: sectionId,
      is_marked: attendance.length > 0,
      students: students.map((s) => ({
        student_id: s.id,
        roll_number: s.roll_number,
        name: s.user?.name || `Student #${s.id}`,
        status: attendanceMap.get(s.id)?.status || null,
        remarks: attendanceMap.get(s.id)?.remarks || null,
      })),
    };
  }

  async getStudentMonthlyAttendance(
    schoolId: number,
    userId: number,
    month: number,
    year: number,
    studentId?: number,
  ) {
    // If studentId not provided, find student by user_id
    let targetStudentId = studentId;
    if (!targetStudentId) {
      const student = await this.studentRepo.findOne({
        where: { school_id: schoolId, user_id: userId },
      });
      if (student) {
        targetStudentId = student.id;
      } else {
        return { records: [], summary: { total_days: 0, present: 0, absent: 0, late: 0, half_day: 0 } };
      }
    }

    // Build date range for the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const records = await this.studentAttRepo
      .createQueryBuilder('a')
      .where('a.school_id = :schoolId', { schoolId })
      .andWhere('a.student_id = :studentId', { studentId: targetStudentId })
      .andWhere('a.date BETWEEN :start AND :end', { start: startDate, end: endDate })
      .orderBy('a.date', 'ASC')
      .getMany();

    // Calculate summary
    const summary = {
      total_days: records.length,
      present: records.filter((r) => r.status === 'present').length,
      absent: records.filter((r) => r.status === 'absent').length,
      late: records.filter((r) => r.status === 'late').length,
      half_day: records.filter((r) => r.status === 'half_day').length,
    };

    return {
      month,
      year,
      student_id: targetStudentId,
      records: records.map((r) => ({ date: r.date, status: r.status, remarks: r.remarks })),
      summary,
    };
  }

  async markStaffAttendance(schoolId: number, dto: MarkStaffAttendanceDto, markedBy: number) {
    const { date, attendance } = dto;

    const results: StaffAttendanceEntity[] = [];
    for (const item of attendance) {
      const existing = await this.staffAttRepo.findOne({
        where: { school_id: schoolId, user_id: item.user_id, date },
      });

      if (existing) {
        existing.status = item.status;
        existing.check_in_time = item.check_in_time ? new Date(item.check_in_time) : existing.check_in_time;
        existing.check_out_time = item.check_out_time ? new Date(item.check_out_time) : existing.check_out_time;
        existing.remarks = item.remarks || existing.remarks;
        existing.marked_by = markedBy;
        results.push(await this.staffAttRepo.save(existing));
      } else {
        const record = this.staffAttRepo.create({
          school_id: schoolId,
          user_id: item.user_id,
          date,
          status: item.status,
          check_in_time: item.check_in_time ? new Date(item.check_in_time) : undefined,
          check_out_time: item.check_out_time ? new Date(item.check_out_time) : undefined,
          remarks: item.remarks,
          marked_by: markedBy,
        });
        results.push(await this.staffAttRepo.save(record));
      }
    }

    return { message: `Staff attendance marked for ${results.length} members`, date };
  }

  async getAttendanceReport(schoolId: number, dto: AttendanceReportDto) {
    const query = this.studentAttRepo
      .createQueryBuilder('a')
      .where('a.school_id = :schoolId', { schoolId })
      .andWhere('a.date BETWEEN :from AND :to', { from: dto.from_date, to: dto.to_date });

    if (dto.class_id) query.andWhere('a.class_id = :classId', { classId: dto.class_id });
    if (dto.section_id) query.andWhere('a.section_id = :sectionId', { sectionId: dto.section_id });
    if (dto.student_id) query.andWhere('a.student_id = :studentId', { studentId: dto.student_id });

    const records = await query.getMany();

    const grouped = new Map<number, { present: number; absent: number; late: number; half_day: number; total: number }>();
    for (const r of records) {
      if (!grouped.has(r.student_id)) {
        grouped.set(r.student_id, { present: 0, absent: 0, late: 0, half_day: 0, total: 0 });
      }
      const g = grouped.get(r.student_id)!;
      g[r.status as keyof typeof g]++;
      g.total++;
    }

    const report = Array.from(grouped.entries()).map(([student_id, stats]) => ({
      student_id,
      ...stats,
      percentage: stats.total > 0 ? Math.round(((stats.present + stats.late + stats.half_day * 0.5) / stats.total) * 100) : 0,
    }));

    return { from_date: dto.from_date, to_date: dto.to_date, total_students: report.length, report };
  }

  async getStaffAttendanceReport(schoolId: number, fromDate: string, toDate: string) {
    const records = await this.staffAttRepo.find({
      where: { school_id: schoolId, date: Between(fromDate, toDate) as any },
    });

    const grouped = new Map<number, { present: number; absent: number; leave: number; late: number; total: number }>();
    for (const r of records) {
      if (!grouped.has(r.user_id)) {
        grouped.set(r.user_id, { present: 0, absent: 0, leave: 0, late: 0, total: 0 });
      }
      const g = grouped.get(r.user_id)!;
      if (r.status === 'present') g.present++;
      else if (r.status === 'absent') g.absent++;
      else if (r.status === 'leave') g.leave++;
      else if (r.status === 'late') g.late++;
      g.total++;
    }

    return Array.from(grouped.entries()).map(([user_id, stats]) => ({ user_id, ...stats }));
  }
}
