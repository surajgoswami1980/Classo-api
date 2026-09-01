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
exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const attendance_service_1 = require("./attendance.service");
const attendance_dto_1 = require("./dto/attendance.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const school_id_decorator_1 = require("../../common/decorators/school-id.decorator");
let AttendanceController = class AttendanceController {
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
    }
    async markStudentAttendance(schoolId, userId, dto) {
        const result = await this.attendanceService.markStudentAttendance(schoolId, dto, userId);
        return { success: true, data: result };
    }
    async getStudentAttendance(schoolId, classId, sectionId, date) {
        const result = await this.attendanceService.getStudentAttendance(schoolId, classId, sectionId, date);
        return { success: true, data: result };
    }
    async getStudentMonthlyAttendance(schoolId, userId, month, year, studentId) {
        const result = await this.attendanceService.getStudentMonthlyAttendance(schoolId, userId, month, year, studentId);
        return { success: true, data: result };
    }
    async getStudentReport(schoolId, dto) {
        const result = await this.attendanceService.getAttendanceReport(schoolId, dto);
        return { success: true, data: result };
    }
    async markStaffAttendance(schoolId, userId, dto) {
        const result = await this.attendanceService.markStaffAttendance(schoolId, dto, userId);
        return { success: true, data: result };
    }
    async getStaffReport(schoolId, fromDate, toDate) {
        const result = await this.attendanceService.getStaffAttendanceReport(schoolId, fromDate, toDate);
        return { success: true, data: result };
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Post)('student/mark'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.TEACHER, roles_decorator_1.UserRole.INCHARGE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.ATTENDANCE_MARK),
    (0, swagger_1.ApiOperation)({ summary: 'Mark student attendance for a class (bulk)' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, attendance_dto_1.MarkStudentAttendanceDto]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "markStudentAttendance", null);
__decorate([
    (0, common_1.Get)('student/get'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.TEACHER, roles_decorator_1.UserRole.INCHARGE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.ATTENDANCE_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Get student attendance for a class/date' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Query)('class_id')),
    __param(2, (0, common_1.Query)('section_id')),
    __param(3, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, String]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getStudentAttendance", null);
__decorate([
    (0, common_1.Get)('student/monthly'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.TEACHER, roles_decorator_1.UserRole.INCHARGE, roles_decorator_1.UserRole.STUDENT, roles_decorator_1.UserRole.PARENT),
    (0, swagger_1.ApiOperation)({ summary: 'Get student monthly attendance (calendar view)' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __param(2, (0, common_1.Query)('month')),
    __param(3, (0, common_1.Query)('year')),
    __param(4, (0, common_1.Query)('student_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, Number, Number]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getStudentMonthlyAttendance", null);
__decorate([
    (0, common_1.Post)('student/report'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.TEACHER, roles_decorator_1.UserRole.INCHARGE, roles_decorator_1.UserRole.PARENT),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.ATTENDANCE_REPORT),
    (0, swagger_1.ApiOperation)({ summary: 'Get student attendance report (date range)' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, attendance_dto_1.AttendanceReportDto]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getStudentReport", null);
__decorate([
    (0, common_1.Post)('staff/mark'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.ATTENDANCE_STAFF_MARK),
    (0, swagger_1.ApiOperation)({ summary: 'Mark staff/teacher attendance (by admin)' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, attendance_dto_1.MarkStaffAttendanceDto]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "markStaffAttendance", null);
__decorate([
    (0, common_1.Get)('staff/report'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.ATTENDANCE_REPORT),
    (0, swagger_1.ApiOperation)({ summary: 'Get staff attendance report' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Query)('from_date')),
    __param(2, (0, common_1.Query)('to_date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getStaffReport", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, swagger_1.ApiTags)('Attendance'),
    (0, common_1.Controller)('attendance'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService])
], AttendanceController);
//# sourceMappingURL=attendance.controller.js.map