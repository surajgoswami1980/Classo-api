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
exports.StudentController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const school_id_decorator_1 = require("../../common/decorators/school-id.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const student_service_1 = require("./student.service");
const student_dto_1 = require("./dto/student.dto");
let StudentController = class StudentController {
    constructor(studentService) {
        this.studentService = studentService;
    }
    async listStudents(query, schoolId) {
        const result = await this.studentService.listStudents(schoolId, query);
        return { success: true, ...result };
    }
    async createStudent(dto, schoolId) {
        const result = await this.studentService.createStudent(schoolId, dto);
        return { success: true, data: result };
    }
    async bulkImportStudents(file, schoolId) {
        if (!file)
            throw new common_1.BadRequestException('CSV file is required (field name: "file")');
        const result = await this.studentService.bulkImportStudents(schoolId, file.buffer);
        return { success: true, data: result };
    }
    async getStudentDashboard(userId, schoolId) {
        const result = await this.studentService.getStudentDashboard(schoolId, userId);
        return { success: true, data: result };
    }
    async getStudentDetail(id, schoolId) {
        const result = await this.studentService.getStudentDetail(schoolId, id);
        return { success: true, data: result };
    }
    async updateStudent(id, dto, schoolId) {
        const result = await this.studentService.updateStudent(schoolId, id, dto);
        return { success: true, data: result };
    }
    async promoteStudents(dto, schoolId) {
        const result = await this.studentService.promoteStudents(schoolId, dto);
        return { success: true, data: result };
    }
};
exports.StudentController = StudentController;
__decorate([
    (0, common_1.Get)('list'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.TEACHER, roles_decorator_1.UserRole.INCHARGE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.STUDENT_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'List students filtered by class/section/status, paginated' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [student_dto_1.ListStudentsQueryDto, Number]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "listStudents", null);
__decorate([
    (0, common_1.Post)('create'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.STUDENT_CREATE),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new student' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [student_dto_1.CreateStudentDto, Number]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "createStudent", null);
__decorate([
    (0, common_1.Post)('import'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.STUDENT_IMPORT),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Bulk import students from a CSV file' }),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "bulkImportStudents", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.STUDENT, roles_decorator_1.UserRole.PARENT),
    (0, swagger_1.ApiOperation)({ summary: "A student's own dashboard — today's timetable, attendance summary, upcoming assignments" }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __param(1, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "getStudentDashboard", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.TEACHER, roles_decorator_1.UserRole.INCHARGE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.STUDENT_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Get full student detail' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "getStudentDetail", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.STUDENT_UPDATE),
    (0, swagger_1.ApiOperation)({ summary: 'Update a student' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, student_dto_1.UpdateStudentDto, Number]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "updateStudent", null);
__decorate([
    (0, common_1.Post)('promote'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.STUDENT_UPDATE),
    (0, swagger_1.ApiOperation)({ summary: 'Promote a batch of students to a new class/section' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [student_dto_1.PromoteStudentsDto, Number]),
    __metadata("design:returntype", Promise)
], StudentController.prototype, "promoteStudents", null);
exports.StudentController = StudentController = __decorate([
    (0, swagger_1.ApiTags)('Student'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('student'),
    __metadata("design:paramtypes", [student_service_1.StudentService])
], StudentController);
//# sourceMappingURL=student.controller.js.map