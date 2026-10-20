import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { StudentAttendanceEntity } from '../../entities/student-attendance.entity';
import { StaffAttendanceEntity } from '../../entities/staff-attendance.entity';
import { StudentEntity } from '../../entities/student.entity';
import { MarkStudentAttendanceDto, MarkStaffAttendanceDto, AttendanceReportDto } from './dto/attendance.dto';
import { AttendanceConfigService, zonedNow } from './attendance-config.service';
import { DayInfo, HolidayService, toDateStr } from './holiday.service';

function monthRange(month: number, year: number) {
  const m = Number(month);
  const y = Number(year);
  const lastDay = new Date(y, m, 0).getDate();
  return {
    startDate: `${y}-${String(m).padStart(2, '0')}-01`,
    endDate: `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
  };
}

function emptySummary() {
  return { total_days: 0, present: 0, absent: 0, late: 0, half_day: 0, leave: 0, holidays: 0, percentage: 0 };
}

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(StudentAttendanceEntity)
    private studentAttRepo: Repository<StudentAttendanceEntity>,
    @InjectRepository(StaffAttendanceEntity)
    private staffAttRepo: Repository<StaffAttendanceEntity>,
    @InjectRepository(StudentEntity)
    private studentRepo: Repository<StudentEntity>,
    private readonly holidays: HolidayService,
    private readonly configs: AttendanceConfigService,
  ) {}

  async markStudentAttendance(schoolId: number, dto: MarkStudentAttendanceDto, markedBy: number) {
    const { class_id, section_id, date, attendance } = dto;

    const cfg = await this.configs.get(schoolId);
    if (date > zonedNow(cfg.timezone).date) {
      throw new BadRequestException('Cannot mark attendance for a future date');
    }
    await this.assertWorkingDay(schoolId, date, 'students');

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
    const { startDate, endDate } = monthRange(month, year);
    const holidays = await this.monthHolidays(schoolId, startDate, endDate, 'students');

    // If studentId not provided, find student by user_id
    let targetStudentId = studentId;
    if (!targetStudentId) {
      const student = await this.studentRepo.findOne({
        where: { school_id: schoolId, user_id: userId },
      });
      if (student) {
        targetStudentId = student.id;
      } else {
        return { month, year, records: [], holidays, summary: emptySummary() };
      }
    }

    const records = await this.studentAttRepo
      .createQueryBuilder('a')
      .where('a.school_id = :schoolId', { schoolId })
      .andWhere('a.student_id = :studentId', { studentId: targetStudentId })
      .andWhere('a.date BETWEEN :start AND :end', { start: startDate, end: endDate })
      .orderBy('a.date', 'ASC')
      .getMany();

    return {
      month,
      year,
      student_id: targetStudentId,
      records: records.map((r) => ({ date: toDateStr(r.date), status: r.status, remarks: r.remarks })),
      holidays,
      summary: await this.summarise(schoolId, records, holidays, 'students'),
    };
  }

  /**
   * A staff member's own monthly attendance — calendar view, including holidays,
   * check-in/out times and how each day was marked.
   */
  async getMyStaffMonthlyAttendance(schoolId: number, userId: number, month: number, year: number) {
    const { startDate, endDate } = monthRange(month, year);
    const holidays = await this.monthHolidays(schoolId, startDate, endDate, 'staff');

    const records = await this.staffAttRepo
      .createQueryBuilder('a')
      .where('a.school_id = :schoolId', { schoolId })
      .andWhere('a.user_id = :userId', { userId })
      .andWhere('a.date BETWEEN :start AND :end', { start: startDate, end: endDate })
      .orderBy('a.date', 'ASC')
      .getMany();

    return {
      month,
      year,
      records: records.map((r) => ({
        date: toDateStr(r.date),
        status: r.status,
        remarks: r.remarks,
        method: r.method,
        check_in_time: r.check_in_time,
        check_out_time: r.check_out_time,
        late_minutes: r.late_minutes,
      })),
      holidays,
      summary: await this.summarise(schoolId, records, holidays, 'staff'),
    };
  }

  /** Upcoming holidays for calendars and dashboards. */
  async upcomingHolidays(schoolId: number, role: string) {
    const cfg = await this.configs.get(schoolId);
    const today = zonedNow(cfg.timezone).date;
    const audience = ['student', 'parent'].includes(role) ? 'students' : 'staff';
    const list = await this.holidays.upcoming(schoolId, today, audience, 15);
    return list.map((h) => ({
      id: h.id,
      title: h.title,
      description: h.description,
      start_date: toDateStr(h.start_date),
      end_date: toDateStr(h.end_date),
      type: h.type,
      applies_to: h.applies_to,
    }));
  }

  private async monthHolidays(schoolId: number, from: string, to: string, audience: 'students' | 'staff') {
    const off = await this.holidays.nonWorkingDays(schoolId, from, to, audience);
    return [...off.values()];
  }

  /**
   * Percentage = attended ÷ working days so far. Holidays and weekly offs never count.
   * Half day = 0.5. Late counts as attended.
   */
  private async summarise(
    schoolId: number,
    records: { date: string; status: string }[],
    holidays: DayInfo[],
    audience: 'students' | 'staff',
  ) {
    const offDates = new Set(holidays.map((h) => h.date));
    const counted = records.filter((r) => !offDates.has(toDateStr(r.date)));
    const s = {
      total_days: counted.length,
      present: counted.filter((r) => r.status === 'present').length,
      absent: counted.filter((r) => r.status === 'absent').length,
      late: counted.filter((r) => r.status === 'late').length,
      half_day: counted.filter((r) => r.status === 'half_day').length,
      leave: counted.filter((r) => r.status === 'leave').length,
      holidays: holidays.filter((h) => h.kind === 'holiday').length,
      percentage: 0,
    };
    const attended = s.present + s.late + s.half_day * 0.5;
    s.percentage = s.total_days > 0 ? Math.round((attended / s.total_days) * 100) : 0;
    return { ...s, audience };
  }

  /** Throws if the date is a holiday / weekly off for the audience. */
  async assertWorkingDay(schoolId: number, date: string, audience: 'students' | 'staff') {
    const off = await this.holidays.dayOff(schoolId, date, audience);
    if (off) {
      throw new BadRequestException(
        off.kind === 'holiday' ? `${date} is a holiday (${off.title}). Attendance cannot be marked.` : `${date} is a weekly off day.`,
      );
    }
  }

  async markStaffAttendance(schoolId: number, dto: MarkStaffAttendanceDto, markedBy: number) {
    const { date, attendance } = dto;
    await this.assertWorkingDay(schoolId, date, 'staff');

    const results: StaffAttendanceEntity[] = [];
    for (const item of attendance) {
      const existing = await this.staffAttRepo.findOne({
        where: { school_id: schoolId, user_id: item.user_id, date },
      });

      if (existing) {
        // An admin override of a self/biometric check-in keeps the times and becomes manual.
        if (existing.status !== item.status) existing.method = 'manual';
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
          method: 'manual',
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
