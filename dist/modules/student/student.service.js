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
exports.StudentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = require("bcryptjs");
const student_entity_1 = require("../../entities/student.entity");
const user_entity_1 = require("../../entities/user.entity");
const class_entity_1 = require("../../entities/class.entity");
const section_entity_1 = require("../../entities/section.entity");
const spatie_role_service_1 = require("../../common/providers/spatie-role.service");
let StudentService = class StudentService {
    constructor(studentRepo, userRepo, classRepo, sectionRepo, spatieRole) {
        this.studentRepo = studentRepo;
        this.userRepo = userRepo;
        this.classRepo = classRepo;
        this.sectionRepo = sectionRepo;
        this.spatieRole = spatieRole;
    }
    async listStudents(schoolId, query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const qb = this.studentRepo
            .createQueryBuilder('s')
            .innerJoin(user_entity_1.UserEntity, 'u', 'u.id = s.user_id')
            .leftJoin(class_entity_1.ClassEntity, 'c', 'c.id = s.class_id')
            .leftJoin(section_entity_1.SectionEntity, 'sec', 'sec.id = s.section_id')
            .select([
            's.id AS id', 's.admission_number AS admission_number', 's.roll_number AS roll_number',
            's.class_id AS class_id', 's.section_id AS section_id', 's.status AS status',
            's.date_of_birth AS date_of_birth', 's.gender AS gender',
            'u.name AS name', 'u.email AS email', 'u.phone AS phone', 'u.avatar AS avatar',
            'c.name AS class_name', 'sec.name AS section_name',
        ])
            .where('s.school_id = :schoolId', { schoolId });
        if (query.class_id)
            qb.andWhere('s.class_id = :classId', { classId: query.class_id });
        if (query.section_id)
            qb.andWhere('s.section_id = :sectionId', { sectionId: query.section_id });
        if (query.status)
            qb.andWhere('s.status = :status', { status: query.status });
        if (query.search) {
            qb.andWhere('(u.name LIKE :search OR s.admission_number LIKE :search OR s.roll_number LIKE :search OR u.phone LIKE :search)', {
                search: `%${query.search}%`,
            });
        }
        const total = await qb.getCount();
        const data = await qb
            .orderBy('s.created_at', 'DESC')
            .offset((page - 1) * limit)
            .limit(limit)
            .getRawMany();
        return { data, total, page, limit, total_pages: Math.ceil(total / limit) };
    }
    async createStudent(schoolId, dto) {
        await this.assertClassAndSection(schoolId, dto.class_id, dto.section_id);
        if (dto.email) {
            const existing = await this.userRepo.findOne({ where: { email: dto.email } });
            if (existing)
                throw new common_1.ConflictException('A user with this email already exists');
        }
        const plainPassword = dto.password || dto.phone || 'Student@123';
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        const user = await this.userRepo.save(this.userRepo.create({
            name: dto.name,
            email: dto.email || undefined,
            phone: dto.phone || undefined,
            password: hashedPassword,
            school_id: schoolId,
            is_active: true,
        }));
        const student = await this.studentRepo.save(this.studentRepo.create({
            school_id: schoolId,
            user_id: user.id,
            class_id: dto.class_id,
            section_id: dto.section_id,
            admission_number: dto.admission_number,
            roll_number: dto.roll_number,
            date_of_birth: dto.date_of_birth,
            gender: dto.gender,
            blood_group: dto.blood_group,
            address: dto.address,
            city: dto.city,
            state: dto.state,
            pincode: dto.pincode,
            admission_date: (dto.admission_date || new Date().toISOString().slice(0, 10)),
            father_name: dto.father_name,
            father_phone: dto.father_phone,
            mother_name: dto.mother_name,
            mother_phone: dto.mother_phone,
            guardian_name: dto.guardian_name,
            guardian_phone: dto.guardian_phone,
            status: 'active',
        }));
        await this.spatieRole.assignRole(user.id, 'student');
        return { ...student, name: user.name, email: user.email, phone: user.phone, temp_password: dto.password ? undefined : plainPassword };
    }
    async bulkImportStudents(schoolId, fileBuffer) {
        const rows = this.parseCsv(fileBuffer.toString('utf-8'));
        if (rows.length === 0) {
            throw new common_1.BadRequestException('CSV file is empty or has no data rows');
        }
        const results = { total: rows.length, created: 0, failed: 0, errors: [] };
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                if (!row.name || !row.class_id || !row.section_id) {
                    throw new Error('name, class_id, and section_id are required');
                }
                await this.createStudent(schoolId, {
                    name: row.name,
                    email: row.email || undefined,
                    phone: row.phone || undefined,
                    class_id: Number(row.class_id),
                    section_id: Number(row.section_id),
                    admission_number: row.admission_number || undefined,
                    roll_number: row.roll_number || undefined,
                    date_of_birth: row.date_of_birth || undefined,
                    gender: row.gender || undefined,
                    father_name: row.father_name || undefined,
                    father_phone: row.father_phone || undefined,
                    mother_name: row.mother_name || undefined,
                    mother_phone: row.mother_phone || undefined,
                    address: row.address || undefined,
                });
                results.created++;
            }
            catch (e) {
                results.failed++;
                results.errors.push({ row: i + 2, error: e.message || 'Unknown error' });
            }
        }
        return results;
    }
    async getStudentDetail(schoolId, id) {
        const row = await this.studentRepo
            .createQueryBuilder('s')
            .innerJoin(user_entity_1.UserEntity, 'u', 'u.id = s.user_id')
            .leftJoin(class_entity_1.ClassEntity, 'c', 'c.id = s.class_id')
            .leftJoin(section_entity_1.SectionEntity, 'sec', 'sec.id = s.section_id')
            .select(['s.*', 'u.name AS name', 'u.email AS email', 'u.phone AS phone', 'u.avatar AS avatar', 'c.name AS class_name', 'sec.name AS section_name'])
            .where('s.id = :id AND s.school_id = :schoolId', { id, schoolId })
            .getRawOne();
        if (!row)
            throw new common_1.NotFoundException('Student not found');
        return row;
    }
    async updateStudent(schoolId, id, dto) {
        const student = await this.studentRepo.findOne({ where: { id, school_id: schoolId } });
        if (!student)
            throw new common_1.NotFoundException('Student not found');
        if (dto.class_id || dto.section_id) {
            await this.assertClassAndSection(schoolId, dto.class_id ?? student.class_id, dto.section_id ?? student.section_id);
        }
        if (dto.name || dto.email !== undefined || dto.phone !== undefined) {
            await this.userRepo.update({ id: student.user_id }, {
                ...(dto.name && { name: dto.name }),
                ...(dto.email !== undefined && { email: dto.email }),
                ...(dto.phone !== undefined && { phone: dto.phone }),
            });
        }
        Object.assign(student, {
            ...(dto.class_id !== undefined && { class_id: dto.class_id }),
            ...(dto.section_id !== undefined && { section_id: dto.section_id }),
            ...(dto.admission_number !== undefined && { admission_number: dto.admission_number }),
            ...(dto.roll_number !== undefined && { roll_number: dto.roll_number }),
            ...(dto.date_of_birth !== undefined && { date_of_birth: dto.date_of_birth }),
            ...(dto.gender !== undefined && { gender: dto.gender }),
            ...(dto.blood_group !== undefined && { blood_group: dto.blood_group }),
            ...(dto.address !== undefined && { address: dto.address }),
            ...(dto.city !== undefined && { city: dto.city }),
            ...(dto.state !== undefined && { state: dto.state }),
            ...(dto.pincode !== undefined && { pincode: dto.pincode }),
            ...(dto.father_name !== undefined && { father_name: dto.father_name }),
            ...(dto.father_phone !== undefined && { father_phone: dto.father_phone }),
            ...(dto.mother_name !== undefined && { mother_name: dto.mother_name }),
            ...(dto.mother_phone !== undefined && { mother_phone: dto.mother_phone }),
            ...(dto.status !== undefined && { status: dto.status }),
        });
        await this.studentRepo.save(student);
        return this.getStudentDetail(schoolId, id);
    }
    async promoteStudents(schoolId, dto) {
        await this.assertClassAndSection(schoolId, dto.to_class_id, dto.to_section_id);
        const students = await this.studentRepo.find({
            where: { school_id: schoolId, id: (0, typeorm_2.In)(dto.student_ids) },
        });
        const foundIds = new Set(students.map((s) => s.id));
        const missing = dto.student_ids.filter((id) => !foundIds.has(id));
        if (students.length > 0) {
            await this.studentRepo
                .createQueryBuilder()
                .update(student_entity_1.StudentEntity)
                .set({ class_id: dto.to_class_id, section_id: dto.to_section_id })
                .where('id IN (:...ids) AND school_id = :schoolId', { ids: students.map((s) => s.id), schoolId })
                .execute();
        }
        return {
            message: `Promoted ${students.length} student(s)`,
            promoted: students.length,
            skipped: missing.length,
            skipped_ids: missing,
        };
    }
    async getStudentDashboard(schoolId, userId) {
        const student = await this.studentRepo.findOne({ where: { school_id: schoolId, user_id: userId } });
        if (!student)
            throw new common_1.NotFoundException('Student profile not found for this account');
        const today = new Date();
        const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
        const todayStr = today.toISOString().slice(0, 10);
        const [todayTimetable, attendanceRows, upcomingAssignments] = await Promise.all([
            this.studentRepo.query(`SELECT tp.period_number, tp.start_time, tp.end_time,
                sub.name as subject_name, u.name as teacher_name
         FROM timetable_periods tp
         LEFT JOIN subjects sub ON sub.id = tp.subject_id
         LEFT JOIN teachers t ON t.id = tp.teacher_id
         LEFT JOIN users u ON u.id = t.user_id
         WHERE tp.school_id = ? AND tp.class_id = ? AND tp.section_id = ? AND tp.day_of_week = ?
         ORDER BY tp.period_number`, [schoolId, student.class_id, student.section_id, dayOfWeek]),
            this.studentRepo.query(`SELECT status, COUNT(*) as count FROM student_attendance
         WHERE school_id = ? AND student_id = ? AND date >= ?
         GROUP BY status`, [schoolId, student.id, monthStart]),
            this.studentRepo.query(`SELECT a.id, a.title, a.due_date, sub.name as subject_name
         FROM assignments a
         LEFT JOIN subjects sub ON sub.id = a.subject_id
         WHERE a.school_id = ? AND a.class_id = ? AND a.section_id = ?
           AND a.status = 'published' AND a.due_date >= ?
         ORDER BY a.due_date ASC LIMIT 5`, [schoolId, student.class_id, student.section_id, todayStr]),
        ]);
        const totalMarked = attendanceRows.reduce((sum, r) => sum + Number(r.count), 0);
        const countFor = (status) => Number(attendanceRows.find((r) => r.status === status)?.count) || 0;
        const pct = (count) => (totalMarked > 0 ? Math.round((count / totalMarked) * 100) : 0);
        return {
            today_timetable: todayTimetable,
            attendance_summary: {
                present: pct(countFor('present')),
                absent: pct(countFor('absent')),
                late: pct(countFor('late')),
                total_marked_days: totalMarked,
            },
            upcoming_assignments: upcomingAssignments,
        };
    }
    async assertClassAndSection(schoolId, classId, sectionId) {
        const [cls, section] = await Promise.all([
            this.classRepo.findOne({ where: { id: classId, school_id: schoolId } }),
            this.sectionRepo.findOne({ where: { id: sectionId, school_id: schoolId, class_id: classId } }),
        ]);
        if (!cls)
            throw new common_1.BadRequestException('Invalid class for this school');
        if (!section)
            throw new common_1.BadRequestException('Invalid section for the selected class');
    }
    parseCsv(content) {
        const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
        if (lines.length < 2)
            return [];
        const parseLine = (line) => {
            const values = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                if (char === '"') {
                    if (inQuotes && line[i + 1] === '"') {
                        current += '"';
                        i++;
                    }
                    else {
                        inQuotes = !inQuotes;
                    }
                }
                else if (char === ',' && !inQuotes) {
                    values.push(current.trim());
                    current = '';
                }
                else {
                    current += char;
                }
            }
            values.push(current.trim());
            return values;
        };
        const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, '_'));
        return lines.slice(1).map((line) => {
            const values = parseLine(line);
            const row = {};
            headers.forEach((h, idx) => (row[h] = values[idx] ?? ''));
            return row;
        });
    }
};
exports.StudentService = StudentService;
exports.StudentService = StudentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_entity_1.StudentEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.UserEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(class_entity_1.ClassEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(section_entity_1.SectionEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        spatie_role_service_1.SpatieRoleService])
], StudentService);
//# sourceMappingURL=student.service.js.map