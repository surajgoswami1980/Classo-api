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
exports.TimetableController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const school_id_decorator_1 = require("../../common/decorators/school-id.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const timetable_service_1 = require("./timetable.service");
let TimetableController = class TimetableController {
    constructor(timetableService) {
        this.timetableService = timetableService;
    }
    async getClassTimetable(schoolId, classId, sectionId) {
        const result = await this.timetableService.getClassTimetable(schoolId, classId, sectionId);
        return { success: true, data: result };
    }
    async getStudentTodayTimetable(schoolId, userId) {
        const result = await this.timetableService.getStudentTodayTimetable(schoolId, userId);
        return { success: true, data: result };
    }
    async getStudentWeekTimetable(schoolId, userId) {
        const result = await this.timetableService.getStudentWeekTimetable(schoolId, userId);
        return { success: true, data: result };
    }
};
exports.TimetableController = TimetableController;
__decorate([
    (0, common_1.Get)('class'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.TEACHER, roles_decorator_1.UserRole.INCHARGE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.TIMETABLE_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Get timetable for a class/section' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Query)('class_id')),
    __param(2, (0, common_1.Query)('section_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", Promise)
], TimetableController.prototype, "getClassTimetable", null);
__decorate([
    (0, common_1.Get)('today'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.STUDENT, roles_decorator_1.UserRole.PARENT),
    (0, swagger_1.ApiOperation)({ summary: 'Get today timetable for student' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], TimetableController.prototype, "getStudentTodayTimetable", null);
__decorate([
    (0, common_1.Get)('week'),
    (0, swagger_1.ApiOperation)({ summary: 'Get full week timetable for student' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], TimetableController.prototype, "getStudentWeekTimetable", null);
exports.TimetableController = TimetableController = __decorate([
    (0, swagger_1.ApiTags)('Timetable'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('timetable'),
    __metadata("design:paramtypes", [timetable_service_1.TimetableService])
], TimetableController);
//# sourceMappingURL=timetable.controller.js.map