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
exports.PayrollController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const school_id_decorator_1 = require("../../common/decorators/school-id.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const payroll_service_1 = require("./payroll.service");
const payroll_dto_1 = require("./dto/payroll.dto");
let PayrollController = class PayrollController {
    constructor(payrollService) {
        this.payrollService = payrollService;
    }
    async myPayslips(schoolId, userId) {
        const result = await this.payrollService.myPayslips(schoolId, userId);
        return { success: true, data: result };
    }
    async listStaff(schoolId) {
        const result = await this.payrollService.listStaff(schoolId);
        return { success: true, data: result };
    }
    async listStructures(schoolId) {
        const result = await this.payrollService.listStructures(schoolId);
        return { success: true, data: result };
    }
    async upsertStructure(schoolId, dto) {
        const result = await this.payrollService.upsertStructure(schoolId, dto);
        return { success: true, data: result };
    }
    async listPayslips(schoolId, month, year) {
        const result = await this.payrollService.listPayslips(schoolId, month ? Number(month) : undefined, year ? Number(year) : undefined);
        return { success: true, data: result };
    }
    async generatePayslip(schoolId, dto) {
        const result = await this.payrollService.generatePayslip(schoolId, dto);
        return { success: true, data: result };
    }
    async markPaid(schoolId, dto) {
        const result = await this.payrollService.markPaid(schoolId, dto);
        return { success: true, data: result };
    }
    async summary(schoolId, month, year) {
        const result = await this.payrollService.getSummary(schoolId, Number(month), Number(year));
        return { success: true, data: result };
    }
};
exports.PayrollController = PayrollController;
__decorate([
    (0, common_1.Get)('my-payslips'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.TEACHER, roles_decorator_1.UserRole.STAFF, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.INCHARGE),
    (0, swagger_1.ApiOperation)({ summary: "A staff member's own payslips" }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "myPayslips", null);
__decorate([
    (0, common_1.Get)('staff'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.PAYROLL_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'List staff eligible for payroll' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "listStaff", null);
__decorate([
    (0, common_1.Get)('structure/list'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.PAYROLL_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'List salary structures' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "listStructures", null);
__decorate([
    (0, common_1.Post)('structure'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.PAYROLL_MANAGE),
    (0, swagger_1.ApiOperation)({ summary: 'Create/update a salary structure' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, payroll_dto_1.SalaryStructureDto]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "upsertStructure", null);
__decorate([
    (0, common_1.Get)('payslip/list'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.PAYROLL_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'List payslips (filter by month/year)' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "listPayslips", null);
__decorate([
    (0, common_1.Post)('payslip/generate'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.PAYROLL_MANAGE),
    (0, swagger_1.ApiOperation)({ summary: 'Generate a payslip for a staff member' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, payroll_dto_1.GeneratePayslipDto]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "generatePayslip", null);
__decorate([
    (0, common_1.Post)('payslip/mark-paid'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.PAYROLL_MANAGE),
    (0, swagger_1.ApiOperation)({ summary: 'Mark a payslip as paid' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, payroll_dto_1.MarkPaidDto]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "markPaid", null);
__decorate([
    (0, common_1.Get)('summary'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.PAYROLL_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Payroll summary for a month/year' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Query)('month')),
    __param(2, (0, common_1.Query)('year')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", Promise)
], PayrollController.prototype, "summary", null);
exports.PayrollController = PayrollController = __decorate([
    (0, swagger_1.ApiTags)('Payroll'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('payroll'),
    __metadata("design:paramtypes", [payroll_service_1.PayrollService])
], PayrollController);
//# sourceMappingURL=payroll.controller.js.map