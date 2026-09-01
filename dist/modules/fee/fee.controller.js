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
exports.FeeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const fee_service_1 = require("./fee.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const school_id_decorator_1 = require("../../common/decorators/school-id.decorator");
let FeeController = class FeeController {
    constructor(feeService) {
        this.feeService = feeService;
    }
    async createStructure(schoolId, dto) {
        const result = await this.feeService.createFeeStructure(schoolId, dto);
        return { success: true, data: result };
    }
    async listStructures(schoolId, classId) {
        const result = await this.feeService.listFeeStructures(schoolId, classId);
        return { success: true, data: result };
    }
    async generateInvoices(schoolId, dto) {
        const result = await this.feeService.generateInvoices(schoolId, dto);
        return { success: true, data: result };
    }
    async listInvoices(schoolId, filters) {
        const result = await this.feeService.listInvoices(schoolId, filters);
        return { success: true, data: result };
    }
    async getStudentInvoices(schoolId, studentId) {
        const result = await this.feeService.getStudentInvoices(schoolId, studentId);
        return { success: true, data: result };
    }
    async initiatePayment(schoolId, userId, dto) {
        const result = await this.feeService.initiatePayment(schoolId, dto, userId);
        return { success: true, data: result };
    }
    async verifyPayment(schoolId, dto) {
        const result = await this.feeService.verifyPayment(schoolId, dto);
        return { success: true, data: result };
    }
    async webhook(req) {
        const result = await this.feeService.handleWebhook(req.body);
        return result;
    }
    async markPaidOffline(schoolId, userId, invoiceId, dto) {
        const result = await this.feeService.markPaidOffline(schoolId, invoiceId, dto, userId);
        return { success: true, data: result };
    }
    async collectionReport(schoolId, fromDate, toDate) {
        const result = await this.feeService.getCollectionReport(schoolId, fromDate, toDate);
        return { success: true, data: result };
    }
    async getDefaulters(schoolId) {
        const result = await this.feeService.getDefaulters(schoolId);
        return { success: true, data: result };
    }
};
exports.FeeController = FeeController;
__decorate([
    (0, common_1.Post)('structure/create'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.FEE_CREATE),
    (0, swagger_1.ApiOperation)({ summary: 'Create fee structure for a class' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, fee_service_1.CreateFeeStructureDto]),
    __metadata("design:returntype", Promise)
], FeeController.prototype, "createStructure", null);
__decorate([
    (0, common_1.Get)('structure/list'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.FEE_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'List all fee structures' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Query)('class_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], FeeController.prototype, "listStructures", null);
__decorate([
    (0, common_1.Post)('invoice/generate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.FEE_CREATE),
    (0, swagger_1.ApiOperation)({ summary: 'Generate invoices for all students in a class' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, fee_service_1.GenerateInvoicesDto]),
    __metadata("design:returntype", Promise)
], FeeController.prototype, "generateInvoices", null);
__decorate([
    (0, common_1.Get)('invoice/list'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.FEE_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'List invoices with filters' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, fee_service_1.InvoiceFiltersDto]),
    __metadata("design:returntype", Promise)
], FeeController.prototype, "listInvoices", null);
__decorate([
    (0, common_1.Get)('invoice/student/:studentId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get invoices for a specific student (parent/student portal)' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Param)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], FeeController.prototype, "getStudentInvoices", null);
__decorate([
    (0, common_1.Post)('payment/initiate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Initiate Razorpay payment for an invoice' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, fee_service_1.InitiatePaymentDto]),
    __metadata("design:returntype", Promise)
], FeeController.prototype, "initiatePayment", null);
__decorate([
    (0, common_1.Post)('payment/verify'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Verify Razorpay payment after completion' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, fee_service_1.VerifyPaymentDto]),
    __metadata("design:returntype", Promise)
], FeeController.prototype, "verifyPayment", null);
__decorate([
    (0, common_1.Post)('payment/webhook'),
    (0, common_1.HttpCode)(200),
    (0, swagger_1.ApiOperation)({ summary: 'Razorpay webhook endpoint (no auth required)' }),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FeeController.prototype, "webhook", null);
__decorate([
    (0, common_1.Post)('payment/offline/:invoiceId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.FEE_COLLECT),
    (0, swagger_1.ApiOperation)({ summary: 'Record offline payment (cash/cheque) by admin' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __param(2, (0, common_1.Param)('invoiceId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number, fee_service_1.OfflinePaymentDto]),
    __metadata("design:returntype", Promise)
], FeeController.prototype, "markPaidOffline", null);
__decorate([
    (0, common_1.Get)('collection-report'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.FEE_REPORT),
    (0, swagger_1.ApiOperation)({ summary: 'Fee collection report with daily breakdown' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Query)('from_date')),
    __param(2, (0, common_1.Query)('to_date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String]),
    __metadata("design:returntype", Promise)
], FeeController.prototype, "collectionReport", null);
__decorate([
    (0, common_1.Get)('defaulters'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.FEE_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Get fee defaulters (students with overdue invoices)' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], FeeController.prototype, "getDefaulters", null);
exports.FeeController = FeeController = __decorate([
    (0, swagger_1.ApiTags)('Fee'),
    (0, common_1.Controller)('fee'),
    __metadata("design:paramtypes", [fee_service_1.FeeService])
], FeeController);
//# sourceMappingURL=fee.controller.js.map