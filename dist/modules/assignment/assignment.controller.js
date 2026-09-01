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
exports.AssignmentController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const school_id_decorator_1 = require("../../common/decorators/school-id.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const assignment_service_1 = require("./assignment.service");
let AssignmentController = class AssignmentController {
    constructor(assignmentService) {
        this.assignmentService = assignmentService;
    }
    async createAssignment(body, schoolId, userId) {
        const result = await this.assignmentService.createAssignment(schoolId, userId, body);
        return { success: true, data: result };
    }
    async listTeacherAssignments(schoolId, userId, classId, sectionId) {
        const result = await this.assignmentService.listTeacherAssignments(schoolId, userId, {
            class_id: classId,
            section_id: sectionId,
        });
        return { success: true, data: result };
    }
    async listStudentAssignments(schoolId, userId) {
        const result = await this.assignmentService.listStudentAssignments(schoolId, userId);
        return { success: true, data: result };
    }
    async getAssignmentDetail(id, schoolId) {
        const result = await this.assignmentService.getAssignment(schoolId, id);
        return { success: true, data: result };
    }
    async deleteAssignment(id, schoolId, userId) {
        const result = await this.assignmentService.deleteAssignment(schoolId, id, userId);
        return { success: true, data: result };
    }
};
exports.AssignmentController = AssignmentController;
__decorate([
    (0, common_1.Post)('create'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.TEACHER, roles_decorator_1.UserRole.INCHARGE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.ASSIGNMENT_CREATE),
    (0, swagger_1.ApiOperation)({ summary: 'Create assignment (teacher/admin)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, school_id_decorator_1.SchoolId)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], AssignmentController.prototype, "createAssignment", null);
__decorate([
    (0, common_1.Get)('list'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.TEACHER, roles_decorator_1.UserRole.INCHARGE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.ASSIGNMENT_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'List teacher assignments' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __param(2, (0, common_1.Query)('class_id')),
    __param(3, (0, common_1.Query)('section_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, Number]),
    __metadata("design:returntype", Promise)
], AssignmentController.prototype, "listTeacherAssignments", null);
__decorate([
    (0, common_1.Get)('student/list'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.STUDENT, roles_decorator_1.UserRole.PARENT),
    (0, swagger_1.ApiOperation)({ summary: 'List assignments for a student (by their class)' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AssignmentController.prototype, "listStudentAssignments", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get assignment detail' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], AssignmentController.prototype, "getAssignmentDetail", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.TEACHER, roles_decorator_1.UserRole.INCHARGE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.ASSIGNMENT_CREATE),
    (0, swagger_1.ApiOperation)({ summary: 'Delete assignment' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, school_id_decorator_1.SchoolId)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", Promise)
], AssignmentController.prototype, "deleteAssignment", null);
exports.AssignmentController = AssignmentController = __decorate([
    (0, swagger_1.ApiTags)('Assignment'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('assignment'),
    __metadata("design:paramtypes", [assignment_service_1.AssignmentService])
], AssignmentController);
//# sourceMappingURL=assignment.controller.js.map