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
exports.AssignmentService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const assignment_entity_1 = require("../../entities/assignment.entity");
const student_entity_1 = require("../../entities/student.entity");
let AssignmentService = class AssignmentService {
    constructor(assignmentRepo, studentRepo) {
        this.assignmentRepo = assignmentRepo;
        this.studentRepo = studentRepo;
    }
    async createAssignment(schoolId, teacherId, data) {
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
    async listTeacherAssignments(schoolId, teacherId, query) {
        const qb = this.assignmentRepo
            .createQueryBuilder('a')
            .where('a.school_id = :schoolId', { schoolId })
            .andWhere('a.teacher_id = :teacherId', { teacherId });
        if (query?.class_id)
            qb.andWhere('a.class_id = :classId', { classId: query.class_id });
        if (query?.section_id)
            qb.andWhere('a.section_id = :sectionId', { sectionId: query.section_id });
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
    async listStudentAssignments(schoolId, userId) {
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
    async getAssignment(schoolId, assignmentId) {
        const assignment = await this.assignmentRepo.findOne({
            where: { id: assignmentId, school_id: schoolId },
        });
        if (!assignment)
            throw new common_1.NotFoundException('Assignment not found');
        return assignment;
    }
    async deleteAssignment(schoolId, assignmentId, teacherId) {
        const assignment = await this.assignmentRepo.findOne({
            where: { id: assignmentId, school_id: schoolId },
        });
        if (!assignment)
            throw new common_1.NotFoundException('Assignment not found');
        if (assignment.teacher_id !== teacherId) {
            throw new common_1.ForbiddenException('You can only delete your own assignments');
        }
        await this.assignmentRepo.remove(assignment);
        return { message: 'Assignment deleted' };
    }
};
exports.AssignmentService = AssignmentService;
exports.AssignmentService = AssignmentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(assignment_entity_1.AssignmentEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(student_entity_1.StudentEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], AssignmentService);
//# sourceMappingURL=assignment.service.js.map