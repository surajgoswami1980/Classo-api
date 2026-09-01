"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const student_attendance_entity_1 = require("../../entities/student-attendance.entity");
const staff_attendance_entity_1 = require("../../entities/staff-attendance.entity");
const student_entity_1 = require("../../entities/student.entity");
let AttendanceService = class AttendanceService {
    constructor(studentAttRepo, staffAttRepo, studentRepo) {
        this.studentAttRepo = studentAttRepo;
        this.staffAttRepo = staffAttRepo;
        this.studentRepo = studentRepo;
    }
    async markStudentAttendance(schoolId, dto, markedBy) {
        const { class_id, section_id, date, attendance } = dto;
        if (new Date(date) > new Date()) {
            throw new common_1.BadRequestException('Cannot mark attendance for a future date');
        }
        const results = [];
        for (const item of attendance) {
            const existing = await this.studentAttRepo.findOne({
                where: { school_id: schoolId, student_id: item.student_id, date },
            });
            if (existing) {
                existing.status = item.status;
                existing.remarks = item.remarks || existing.remarks;
                existing.marked_by = markedBy;
                results.push(await this.studentAttRepo.save(existing));
            }
            else {
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
    async getStudentAttendance(schoolId, classId, sectionId, date) {
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
    async getStudentMonthlyAttendance(schoolId, userId, month, year, studentId) {
        let targetStudentId = studentId;
        if (!targetStudentId) {
            const student = await this.studentRepo.findOne({
                where: { school_id: schoolId, user_id: userId },
            });
            if (student) {
                targetStudentId = student.id;
            }
            else {
                return { records: [], summary: { total_days: 0, present: 0, absent: 0, late: 0, half_day: 0 } };
            }
        }
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
    async markStaffAttendance(schoolId, dto, markedBy) {
        const { date, attendance } = dto;
        const results = [];
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
            }
            else {
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
    async getAttendanceReport(schoolId, dto) {
        const query = this.studentAttRepo
            .createQueryBuilder('a')
            .where('a.school_id = :schoolId', { schoolId })
            .andWhere('a.date BETWEEN :from AND :to', { from: dto.from_date, to: dto.to_date });
        if (dto.class_id)
            query.andWhere('a.class_id = :classId', { classId: dto.class_id });
        if (dto.section_id)
            query.andWhere('a.section_id = :sectionId', { sectionId: dto.section_id });
        if (dto.student_id)
            query.andWhere('a.student_id = :studentId', { studentId: dto.student_id });
        const records = await query.getMany();
        const grouped = new Map();
        for (const r of records) {
            if (!grouped.has(r.student_id)) {
                grouped.set(r.student_id, { present: 0, absent: 0, late: 0, half_day: 0, total: 0 });
            }
            const g = grouped.get(r.student_id);
            g[r.status]++;
            g.total++;
        }
        const report = Array.from(grouped.entries()).map(([student_id, stats]) => ({
            student_id,
            ...stats,
            percentage: stats.total > 0 ? Math.round(((stats.present + stats.late + stats.half_day * 0.5) / stats.total) * 100) : 0,
        }));
        return { from_date: dto.from_date, to_date: dto.to_date, total_students: report.length, report };
    }
    async getStaffAttendanceReport(schoolId, fromDate, toDate) {
        const records = await this.staffAttRepo.find({
            where: { school_id: schoolId, date: (0, typeorm_2.Between)(fromDate, toDate) },
        });
        const grouped = new Map();
        for (const r of records) {
            if (!grouped.has(r.user_id)) {
                grouped.set(r.user_id, { present: 0, absent: 0, leave: 0, late: 0, total: 0 });
            }
            const g = grouped.get(r.user_id);
            if (r.status === 'present')
                g.present++;
            else if (r.status === 'absent')
                g.absent++;
            else if (r.status === 'leave')
                g.leave++;
            else if (r.status === 'late')
                g.late++;
            g.total++;
        }
        return Array.from(grouped.entries()).map(([user_id, stats]) => ({ user_id, ...stats }));
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_attendance_entity_1.StudentAttendanceEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(staff_attendance_entity_1.StaffAttendanceEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(student_entity_1.StudentEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map