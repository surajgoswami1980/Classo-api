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
exports.SettingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const school_id_decorator_1 = require("../../common/decorators/school-id.decorator");
const settings_service_1 = require("./settings.service");
const settings_dto_1 = require("./dto/settings.dto");
let SettingsController = class SettingsController {
    constructor(settingsService) {
        this.settingsService = settingsService;
    }
    async getSettings(schoolId) {
        const result = await this.settingsService.getSettings(schoolId);
        return { success: true, data: result };
    }
    async updateSettings(dto, schoolId) {
        const result = await this.settingsService.updateSettings(schoolId, dto);
        return { success: true, data: result };
    }
    async getAcademicYear(schoolId) {
        const result = await this.settingsService.getAcademicYear(schoolId);
        return { success: true, data: result };
    }
    async updateAcademicYear(dto, schoolId) {
        const result = await this.settingsService.updateAcademicYear(schoolId, dto);
        return { success: true, data: result };
    }
};
exports.SettingsController = SettingsController;
__decorate([
    (0, common_1.Get)(),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.SETTINGS_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Get school settings (grading scale, thresholds, working days, etc.)' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Put)(),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.SETTINGS_MANAGE),
    (0, swagger_1.ApiOperation)({ summary: 'Update school settings' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [settings_dto_1.UpdateSettingsDto, Number]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Get)('academic-year'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.SETTINGS_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Get the current academic year and session history' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "getAcademicYear", null);
__decorate([
    (0, common_1.Put)('academic-year'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.SETTINGS_MANAGE),
    (0, swagger_1.ApiOperation)({ summary: 'Create/update an academic year, optionally making it current' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [settings_dto_1.UpdateAcademicYearDto, Number]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "updateAcademicYear", null);
exports.SettingsController = SettingsController = __decorate([
    (0, swagger_1.ApiTags)('Settings'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('settings'),
    __metadata("design:paramtypes", [settings_service_1.SettingsService])
], SettingsController);
//# sourceMappingURL=settings.controller.js.map