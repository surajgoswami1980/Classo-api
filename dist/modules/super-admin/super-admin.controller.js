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
exports.SuperAdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const super_admin_service_1 = require("./super-admin.service");
const super_admin_guard_1 = require("../../common/guards/super-admin.guard");
const super_admin_dto_1 = require("./dto/super-admin.dto");
let SuperAdminController = class SuperAdminController {
    constructor(superAdminService) {
        this.superAdminService = superAdminService;
    }
    async listSchools(query) {
        const result = await this.superAdminService.listSchools(query);
        return { success: true, ...result };
    }
    async createSchool(dto) {
        const result = await this.superAdminService.createSchool(dto);
        return { success: true, data: result };
    }
    async toggleSchoolStatus(dto) {
        const result = await this.superAdminService.toggleSchoolStatus(dto);
        return { success: true, data: result };
    }
    async getDashboard() {
        const result = await this.superAdminService.getDashboard();
        return { success: true, data: result };
    }
};
exports.SuperAdminController = SuperAdminController;
__decorate([
    (0, common_1.Get)('schools'),
    (0, swagger_1.ApiOperation)({ summary: 'List all schools on the platform' }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [super_admin_dto_1.ListSchoolsQueryDto]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "listSchools", null);
__decorate([
    (0, common_1.Post)('school/create'),
    (0, swagger_1.ApiOperation)({ summary: 'Onboard a new school with its initial admin account' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [super_admin_dto_1.CreateSchoolDto]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "createSchool", null);
__decorate([
    (0, common_1.Post)('school/toggle-status'),
    (0, swagger_1.ApiOperation)({ summary: 'Enable or disable a school' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [super_admin_dto_1.ToggleSchoolStatusDto]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "toggleSchoolStatus", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Platform-wide dashboard: tenants, subscriptions, revenue share' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getDashboard", null);
exports.SuperAdminController = SuperAdminController = __decorate([
    (0, swagger_1.ApiTags)('Super Admin'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(super_admin_guard_1.SuperAdminGuard),
    (0, common_1.Controller)('super-admin'),
    __metadata("design:paramtypes", [super_admin_service_1.SuperAdminService])
], SuperAdminController);
//# sourceMappingURL=super-admin.controller.js.map