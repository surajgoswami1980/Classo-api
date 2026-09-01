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
exports.ExamController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const exam_service_1 = require("./exam.service");
const report_card_pdf_service_1 = require("../report/report-card-pdf.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const school_id_decorator_1 = require("../../common/decorators/school-id.decorator");
let ExamController = class ExamController {
    constructor(examService, reportCardPdf) {
        this.examService = examService;
        this.reportCardPdf = reportCardPdf;
    }
    async createExam(schoolId, dto) {
        const result = await this.examService.createExam(schoolId, dto);
        return { success: true, data: result };
    }
    async listExams(schoolId, sessionId) {
        const result = await this.examService.listExams(schoolId, sessionId);
        return { success: true, data: result };
    }
    async getExamSubjects(schoolId, examId, classId) {
        const result = await this.examService.getExamSubjects(schoolId, examId, classId);
        return { success: true, data: result };
    }
    async getMarksEntryData(schoolId, examId, examSubjectId, classId, sectionId) {
        const result = await this.examService.getMarksEntryData(schoolId, examId, examSubjectId, classId, sectionId);
        return { success: true, data: result };
    }
    async enterMarks(schoolId, userId, dto) {
        const result = await this.examService.enterMarks(schoolId, dto, userId);
        return { success: true, data: result };
    }
    async publishExam(schoolId, examId) {
        const result = await this.examService.publishExam(schoolId, examId);
        return { success: true, data: result };
    }
    async getReportCard(schoolId, studentId, examId) {
        const result = await this.examService.getReportCard(schoolId, studentId, examId);
        return { success: true, data: result };
    }
    async getReportCardPdf(schoolId, studentId, examId, res) {
        const reportCard = await this.examService.getReportCard(schoolId, studentId, examId);
        const schoolInfo = {
            name: 'School Name',
            logo_url: '',
            address: '',
            primary_color: '#2563eb',
            board_affiliation: 'CBSE',
        };
        const html = this.reportCardPdf.generateReportCardHtml({
            student: {
                name: reportCard.student.name,
                roll_number: reportCard.student.roll_number,
                admission_number: reportCard.student.admission_number,
                class_name: `Class ${reportCard.student.class_id}`,
                section_name: '',
            },
            exam: {
                name: reportCard.exam.name,
                exam_type: reportCard.exam.exam_type,
                session_name: '',
            },
            subjects: reportCard.subjects,
            summary: reportCard.summary,
            school: schoolInfo,
        });
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    }
    async getResultAnalysis(schoolId, examId, classId) {
        const result = await this.examService.getResultAnalysis(schoolId, examId, classId);
        return { success: true, data: result };
    }
};
exports.ExamController = ExamController;
__decorate([
    (0, common_1.Post)('create'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.EXAM_CREATE),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new exam' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, exam_service_1.CreateExamDto]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "createExam", null);
__decorate([
    (0, common_1.Get)('list'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.TEACHER, roles_decorator_1.UserRole.INCHARGE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.EXAM_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'List all exams' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Query)('session_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "listExams", null);
__decorate([
    (0, common_1.Get)('subjects'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.TEACHER, roles_decorator_1.UserRole.INCHARGE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.EXAM_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'List subjects configured for an exam+class (for the marks-entry subject dropdown)' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Query)('exam_id')),
    __param(2, (0, common_1.Query)('class_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "getExamSubjects", null);
__decorate([
    (0, common_1.Get)('marks/entry-data'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.TEACHER, roles_decorator_1.UserRole.INCHARGE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.EXAM_MARKS_ENTRY),
    (0, swagger_1.ApiOperation)({ summary: 'Get students list + existing marks for marks entry page' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Query)('exam_id')),
    __param(2, (0, common_1.Query)('exam_subject_id')),
    __param(3, (0, common_1.Query)('class_id')),
    __param(4, (0, common_1.Query)('section_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, Number, Number]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "getMarksEntryData", null);
__decorate([
    (0, common_1.Post)('marks/enter'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.TEACHER, roles_decorator_1.UserRole.INCHARGE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.EXAM_MARKS_ENTRY),
    (0, swagger_1.ApiOperation)({ summary: 'Enter/update marks for students (bulk)' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, exam_service_1.EnterMarksDto]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "enterMarks", null);
__decorate([
    (0, common_1.Post)('publish/:examId'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.EXAM_PUBLISH),
    (0, swagger_1.ApiOperation)({ summary: 'Publish exam results (make visible to students/parents)' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Param)('examId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "publishExam", null);
__decorate([
    (0, common_1.Get)('report-card/:studentId'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.TEACHER, roles_decorator_1.UserRole.STUDENT, roles_decorator_1.UserRole.PARENT),
    (0, swagger_1.ApiOperation)({ summary: 'Get report card for a student' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Param)('studentId')),
    __param(2, (0, common_1.Query)('exam_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "getReportCard", null);
__decorate([
    (0, common_1.Get)('report-card/:studentId/pdf'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.TEACHER, roles_decorator_1.UserRole.STUDENT, roles_decorator_1.UserRole.PARENT),
    (0, swagger_1.ApiOperation)({ summary: 'Download report card as PDF (HTML response for PDF generation)' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Param)('studentId')),
    __param(2, (0, common_1.Query)('exam_id')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, Object]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "getReportCardPdf", null);
__decorate([
    (0, common_1.Get)('analysis/:examId'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.TEACHER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.EXAM_REPORT),
    (0, swagger_1.ApiOperation)({ summary: 'Get class-wise result analysis for an exam' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Param)('examId')),
    __param(2, (0, common_1.Query)('class_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "getResultAnalysis", null);
exports.ExamController = ExamController = __decorate([
    (0, swagger_1.ApiTags)('Exam'),
    (0, common_1.Controller)('exam'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [exam_service_1.ExamService,
        report_card_pdf_service_1.ReportCardPdfService])
], ExamController);
//# sourceMappingURL=exam.controller.js.map