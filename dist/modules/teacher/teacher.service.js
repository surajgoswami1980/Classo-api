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
exports.TeacherService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcryptjs");
const teacher_entity_1 = require("../../entities/teacher.entity");
const user_entity_1 = require("../../entities/user.entity");
const spatie_role_service_1 = require("../../common/providers/spatie-role.service");
let TeacherService = class TeacherService {
    constructor(teacherRepo, userRepo, spatieRole) {
        this.teacherRepo = teacherRepo;
        this.userRepo = userRepo;
        this.spatieRole = spatieRole;
    }
    async listTeachers(schoolId, query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const qb = this.teacherRepo
            .createQueryBuilder('t')
            .innerJoin(user_entity_1.UserEntity, 'u', 'u.id = t.user_id')
            .select([
            't.id AS id', 't.designation AS designation', 't.department AS department',
            't.status AS status', 't.date_of_joining AS date_of_joining',
            'u.name AS name', 'u.email AS email', 'u.phone AS phone', 'u.employee_id AS employee_id', 'u.avatar AS avatar',
        ])
            .where('t.school_id = :schoolId', { schoolId });
        if (query.status)
            qb.andWhere('t.status = :status', { status: query.status });
        if (query.department)
            qb.andWhere('t.department = :department', { department: query.department });
        if (query.search) {
            qb.andWhere('(u.name LIKE :search OR u.employee_id LIKE :search OR u.phone LIKE :search)', {
                search: `%${query.search}%`,
            });
        }
        const total = await qb.getCount();
        const data = await qb
            .orderBy('t.created_at', 'DESC')
            .offset((page - 1) * limit)
            .limit(limit)
            .getRawMany();
        return { data, total, page, limit, total_pages: Math.ceil(total / limit) };
    }
    async createTeacher(schoolId, dto) {
        if (dto.email) {
            const existing = await this.userRepo.findOne({ where: { email: dto.email } });
            if (existing)
                throw new common_1.ConflictException('A user with this email already exists');
        }
        if (dto.employee_id) {
            const existing = await this.userRepo.findOne({ where: { employee_id: dto.employee_id, school_id: schoolId } });
            if (existing)
                throw new common_1.ConflictException('This employee ID is already in use');
        }
        const plainPassword = dto.password || dto.phone || 'Teacher@123';
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        const user = await this.userRepo.save(this.userRepo.create({
            name: dto.name,
            email: dto.email || undefined,
            phone: dto.phone || undefined,
            password: hashedPassword,
            school_id: schoolId,
            employee_id: dto.employee_id,
            designation: dto.designation,
            department: dto.department,
            is_active: true,
        }));
        const teacher = await this.teacherRepo.save(this.teacherRepo.create({
            school_id: schoolId,
            user_id: user.id,
            qualifications: dto.qualifications,
            date_of_joining: (dto.date_of_joining || new Date().toISOString().slice(0, 10)),
            designation: dto.designation,
            department: dto.department,
            salary: dto.salary,
            assigned_classes: dto.assigned_classes ?? [],
            assigned_subjects: dto.assigned_subjects ?? [],
            status: 'active',
        }));
        await this.spatieRole.assignRole(user.id, 'teacher');
        return { ...teacher, name: user.name, email: user.email, phone: user.phone, temp_password: dto.password ? undefined : plainPassword };
    }
    async getTeacherDetail(schoolId, id, requestingUserId, requestingRole) {
        const row = await this.teacherRepo
            .createQueryBuilder('t')
            .innerJoin(user_entity_1.UserEntity, 'u', 'u.id = t.user_id')
            .select(['t.*', 'u.name AS name', 'u.email AS email', 'u.phone AS phone', 'u.employee_id AS employee_id', 'u.avatar AS avatar'])
            .where('t.id = :id AND t.school_id = :schoolId', { id, schoolId })
            .getRawOne();
        if (!row)
            throw new common_1.NotFoundException('Teacher not found');
        this.assertCanView(row, requestingUserId, requestingRole);
        return row;
    }
    async getTeacherWorkload(schoolId, id, requestingUserId, requestingRole) {
        const teacher = await this.teacherRepo.findOne({ where: { id, school_id: schoolId } });
        if (!teacher)
            throw new common_1.NotFoundException('Teacher not found');
        this.assertCanView(teacher, requestingUserId, requestingRole);
        const periods = await this.teacherRepo.query(`SELECT tp.day_of_week, tp.period_number, tp.start_time, tp.end_time,
              c.name as class_name, sec.name as section_name, sub.name as subject_name
       FROM timetable_periods tp
       LEFT JOIN classes c ON c.id = tp.class_id
       LEFT JOIN sections sec ON sec.id = tp.section_id
       LEFT JOIN subjects sub ON sub.id = tp.subject_id
       WHERE tp.teacher_id = ? AND tp.school_id = ?
       ORDER BY FIELD(tp.day_of_week, 'monday','tuesday','wednesday','thursday','friday','saturday'), tp.period_number`, [id, schoolId]);
        const distinctClasses = new Set(periods.map((p) => `${p.class_name} ${p.section_name}`));
        return {
            teacher_id: id,
            total_periods_per_week: periods.length,
            distinct_classes: distinctClasses.size,
            periods,
        };
    }
    async updateTeacher(schoolId, id, dto) {
        const teacher = await this.teacherRepo.findOne({ where: { id, school_id: schoolId } });
        if (!teacher)
            throw new common_1.NotFoundException('Teacher not found');
        if (dto.name || dto.email !== undefined || dto.phone !== undefined || dto.employee_id !== undefined || dto.designation !== undefined || dto.department !== undefined) {
            await this.userRepo.update({ id: teacher.user_id }, {
                ...(dto.name && { name: dto.name }),
                ...(dto.email !== undefined && { email: dto.email }),
                ...(dto.phone !== undefined && { phone: dto.phone }),
                ...(dto.employee_id !== undefined && { employee_id: dto.employee_id }),
                ...(dto.designation !== undefined && { designation: dto.designation }),
                ...(dto.department !== undefined && { department: dto.department }),
            });
        }
        if (dto.status === 'resigned' && !dto.date_of_leaving) {
            throw new common_1.BadRequestException('date_of_leaving is required when marking a teacher as resigned');
        }
        Object.assign(teacher, {
            ...(dto.qualifications !== undefined && { qualifications: dto.qualifications }),
            ...(dto.designation !== undefined && { designation: dto.designation }),
            ...(dto.department !== undefined && { department: dto.department }),
            ...(dto.salary !== undefined && { salary: dto.salary }),
            ...(dto.assigned_classes !== undefined && { assigned_classes: dto.assigned_classes }),
            ...(dto.assigned_subjects !== undefined && { assigned_subjects: dto.assigned_subjects }),
            ...(dto.status !== undefined && { status: dto.status }),
            ...(dto.date_of_leaving !== undefined && { date_of_leaving: dto.date_of_leaving }),
        });
        await this.teacherRepo.save(teacher);
        if (dto.status === 'resigned' || dto.status === 'inactive') {
            await this.userRepo.update({ id: teacher.user_id }, { is_active: false });
        }
        return this.getTeacherDetail(schoolId, id);
    }
    assertCanView(teacher, requestingUserId, requestingRole) {
        if (requestingRole !== 'teacher')
            return;
        if (Number(teacher.user_id) !== Number(requestingUserId)) {
            throw new common_1.ForbiddenException('You can only view your own teacher profile');
        }
    }
};
exports.TeacherService = TeacherService;
exports.TeacherService = TeacherService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(teacher_entity_1.TeacherEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        spatie_role_service_1.SpatieRoleService])
], TeacherService);
//# sourceMappingURL=teacher.service.js.map