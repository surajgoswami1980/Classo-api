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
exports.TimetableService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const timetable_period_entity_1 = require("../../entities/timetable-period.entity");
const student_entity_1 = require("../../entities/student.entity");
let TimetableService = class TimetableService {
    constructor(timetableRepo, studentRepo) {
        this.timetableRepo = timetableRepo;
        this.studentRepo = studentRepo;
    }
    async getClassTimetable(schoolId, classId, sectionId) {
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
    async getStudentTodayTimetable(schoolId, userId) {
        const student = await this.studentRepo.findOne({
            where: { school_id: schoolId, user_id: userId, status: 'active' },
        });
        if (!student)
            return [];
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const today = days[new Date().getDay()];
        if (today === 'sunday')
            return [];
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
    async getStudentWeekTimetable(schoolId, userId) {
        const student = await this.studentRepo.findOne({
            where: { school_id: schoolId, user_id: userId, status: 'active' },
        });
        if (!student)
            return [];
        return this.getClassTimetable(schoolId, student.class_id, student.section_id);
    }
};
exports.TimetableService = TimetableService;
exports.TimetableService = TimetableService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(timetable_period_entity_1.TimetablePeriodEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(student_entity_1.StudentEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], TimetableService);
//# sourceMappingURL=timetable.service.js.map