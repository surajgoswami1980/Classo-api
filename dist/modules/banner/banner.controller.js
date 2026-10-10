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
exports.BannerController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const school_id_decorator_1 = require("../../common/decorators/school-id.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const banner_service_1 = require("./banner.service");
let BannerController = class BannerController {
    constructor(bannerService) {
        this.bannerService = bannerService;
    }
    async list(userId, role, schoolId, placement) {
        const data = await this.bannerService.getBanners(schoolId, userId, role, placement);
        return { success: true, data };
    }
    async popup(userId, role, schoolId) {
        const data = await this.bannerService.getPopup(schoolId, userId, role);
        return { success: true, data };
    }
};
exports.BannerController = BannerController;
__decorate([
    (0, common_1.Get)('list'),
    (0, swagger_1.ApiOperation)({ summary: 'Live banners for the current user (optionally filter by placement)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(2, (0, school_id_decorator_1.SchoolId)()),
    __param(3, (0, common_1.Query)('placement')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Number, String]),
    __metadata("design:returntype", Promise)
], BannerController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('popup'),
    (0, swagger_1.ApiOperation)({ summary: 'The single active popup banner for the current user (or null)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)('role')),
    __param(2, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Number]),
    __metadata("design:returntype", Promise)
], BannerController.prototype, "popup", null);
exports.BannerController = BannerController = __decorate([
    (0, swagger_1.ApiTags)('Banner'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('banner'),
    __metadata("design:paramtypes", [banner_service_1.BannerService])
], BannerController);
//# sourceMappingURL=banner.controller.js.map