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
exports.TeacherController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const school_id_decorator_1 = require("../../common/decorators/school-id.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const teacher_service_1 = require("./teacher.service");
const teacher_dto_1 = require("./dto/teacher.dto");
let TeacherController = class TeacherController {
    constructor(teacherService) {
        this.teacherService = teacherService;
    }
    async listTeachers(query, schoolId) {
        const result = await this.teacherService.listTeachers(schoolId, query);
        return { success: true, ...result };
    }
    async createTeacher(dto, schoolId) {
        const result = await this.teacherService.createTeacher(schoolId, dto);
        return { success: true, data: result };
    }
    async getTeacherDetail(id, schoolId, userId, role) {
        const result = await this.teacherService.getTeacherDetail(schoolId, id, userId, role);
        return { success: true, data: result };
    }
    async getTeacherWorkload(id, schoolId, userId, role) {
        const result = await this.teacherService.getTeacherWorkload(schoolId, id, userId, role);
        return { success: true, data: result };
    }
    async updateTeacher(id, dto, schoolId) {
        const result = await this.teacherService.updateTeacher(schoolId, id, dto);
        return { success: true, data: result };
    }
};
exports.TeacherController = TeacherController;
__decorate([
    (0, common_1.Get)('list'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.TEACHER_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'List teachers, paginated' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [teacher_dto_1.ListTeachersQueryDto, Number]),
    __metadata("design:returntype", Promise)
], TeacherController.prototype, "listTeachers", null);
__decorate([
    (0, common_1.Post)('create'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.TEACHER_CREATE),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new teacher' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [teacher_dto_1.CreateTeacherDto, Number]),
    __metadata("design:returntype", Promise)
], TeacherController.prototype, "createTeacher", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.TEACHER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.TEACHER_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Get full teacher detail' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, school_id_decorator_1.SchoolId)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, String]),
    __metadata("design:returntype", Promise)
], TeacherController.prototype, "getTeacherDetail", null);
__decorate([
    (0, common_1.Get)(':id/workload'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.TEACHER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.TEACHER_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Teacher workload — weekly periods and class assignments' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, school_id_decorator_1.SchoolId)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, String]),
    __metadata("design:returntype", Promise)
], TeacherController.prototype, "getTeacherWorkload", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.TEACHER_UPDATE),
    (0, swagger_1.ApiOperation)({ summary: 'Update a teacher (including resignation)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, teacher_dto_1.UpdateTeacherDto, Number]),
    __metadata("design:returntype", Promise)
], TeacherController.prototype, "updateTeacher", null);
exports.TeacherController = TeacherController = __decorate([
    (0, swagger_1.ApiTags)('Teacher'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('teacher'),
    __metadata("design:paramtypes", [teacher_service_1.TeacherService])
], TeacherController);
//# sourceMappingURL=teacher.controller.js.map