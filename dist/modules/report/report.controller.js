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
exports.ReportController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const school_id_decorator_1 = require("../../common/decorators/school-id.decorator");
const report_service_1 = require("./report.service");
let ReportController = class ReportController {
    constructor(reportService) {
        this.reportService = reportService;
    }
    async getAttendanceReport(schoolId, fromDate, toDate, classId, sectionId) {
        const result = await this.reportService.getAttendanceReport(schoolId, fromDate, toDate, classId, sectionId);
        return { success: true, data: result };
    }
    async getFeeCollectionReport(schoolId, fromDate, toDate) {
        const result = await this.reportService.getFeeCollectionReport(schoolId, fromDate, toDate);
        return { success: true, data: result };
    }
    async getExamPerformanceReport(schoolId, examId) {
        const result = await this.reportService.getExamPerformanceReport(schoolId, examId);
        return { success: true, data: result };
    }
    async getStudentStrengthReport(schoolId) {
        const result = await this.reportService.getStudentStrengthReport(schoolId);
        return { success: true, data: result };
    }
};
exports.ReportController = ReportController;
__decorate([
    (0, common_1.Get)('attendance'),
    (0, swagger_1.ApiOperation)({ summary: 'Attendance report by class/section over a date range' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Query)('from_date')),
    __param(2, (0, common_1.Query)('to_date')),
    __param(3, (0, common_1.Query)('class_id')),
    __param(4, (0, common_1.Query)('section_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String, Number, Number]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getAttendanceReport", null);
__decorate([
    (0, common_1.Get)('fee-collection'),
    (0, swagger_1.ApiOperation)({ summary: 'Fee collection totals per class and overall' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Query)('from_date')),
    __param(2, (0, common_1.Query)('to_date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getFeeCollectionReport", null);
__decorate([
    (0, common_1.Get)('exam-performance'),
    (0, swagger_1.ApiOperation)({ summary: 'Class-wise and subject-wise result analysis for an exam' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Query)('exam_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getExamPerformanceReport", null);
__decorate([
    (0, common_1.Get)('student-strength'),
    (0, swagger_1.ApiOperation)({ summary: 'Student headcount per class/section' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ReportController.prototype, "getStudentStrengthReport", null);
exports.ReportController = ReportController = __decorate([
    (0, swagger_1.ApiTags)('Report'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, common_1.Controller)('report'),
    __metadata("design:paramtypes", [report_service_1.ReportService])
], ReportController);
//# sourceMappingURL=report.controller.js.map