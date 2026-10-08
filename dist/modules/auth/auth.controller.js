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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const login_dto_1 = require("./dto/login.dto");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
let AuthController = class AuthController {
    constructor(authService) {
        this.authService = authService;
    }
    async lookupSchool(dto) {
        const result = await this.authService.lookupSchool(dto);
        return { success: true, data: result };
    }
    async login(dto) {
        const result = await this.authService.login(dto);
        return { success: true, data: result };
    }
    async superAdminLogin(dto) {
        const result = await this.authService.superAdminLogin(dto.identifier, dto.password);
        return { success: true, data: result };
    }
    async otpAvailability(dto) {
        const result = await this.authService.getOtpAvailability(dto.school_code);
        return { success: true, data: result };
    }
    async requestOtp(dto) {
        const result = await this.authService.requestOtp(dto.school_code, dto.identifier.trim(), dto.channel);
        return { success: true, message: 'If the account exists, an OTP has been sent.', data: result };
    }
    async verifyOtp(dto) {
        const result = await this.authService.verifyOtp(dto.school_code, dto.identifier.trim(), dto.otp.trim());
        return { success: true, data: result };
    }
    async requestSuperAdminOtp(dto) {
        const result = await this.authService.requestSuperAdminOtp(dto.identifier.trim(), dto.channel);
        return { success: true, message: 'If the account exists, an OTP has been sent.', data: result };
    }
    async verifySuperAdminOtp(dto) {
        const result = await this.authService.verifySuperAdminOtp(dto.identifier.trim(), dto.otp.trim());
        return { success: true, data: result };
    }
    async forgotPassword(dto) {
        await this.authService.forgotPassword(dto.school_code, dto.identifier);
        return { success: true, message: 'If an account matches, a reset link has been sent to its email address.' };
    }
    async resetPassword(dto) {
        await this.authService.resetPassword(dto.token, dto.new_password);
        return { success: true, message: 'Password reset successfully. You can now log in.' };
    }
    async refreshToken(dto) {
        const result = await this.authService.refreshToken(dto.refresh_token);
        return { success: true, data: result };
    }
    async changePassword(userId, body) {
        const result = await this.authService.changePassword(userId, body.old_password, body.new_password);
        return { success: true, data: result };
    }
    async getProfile(userId) {
        const result = await this.authService.getProfile(userId);
        return { success: true, data: result };
    }
    async updateProfile(userId, body) {
        const result = await this.authService.updateProfile(userId, body);
        return { success: true, data: result };
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('lookup-school'),
    (0, swagger_1.ApiOperation)({ summary: 'Step 1: Find school by code (before login screen)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.SchoolLookupDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "lookupSchool", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, swagger_1.ApiOperation)({ summary: 'Step 2: Login with school + credentials' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('super-admin-login'),
    (0, swagger_1.ApiOperation)({ summary: 'Login for platform super admins (no school context)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.SuperAdminLoginDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "superAdminLogin", null);
__decorate([
    (0, common_1.Post)('otp/availability'),
    (0, swagger_1.ApiOperation)({ summary: 'Check if a school has OTP login enabled (and channels)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.SchoolLookupDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "otpAvailability", null);
__decorate([
    (0, common_1.Post)('otp/request'),
    (0, swagger_1.ApiOperation)({ summary: 'Request a login OTP via email or mobile (school user)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.RequestOtpDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "requestOtp", null);
__decorate([
    (0, common_1.Post)('otp/verify'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify a login OTP and sign in (school user)' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.VerifyOtpDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifyOtp", null);
__decorate([
    (0, common_1.Post)('super-admin/otp/request'),
    (0, swagger_1.ApiOperation)({ summary: 'Request a login OTP for a platform super admin' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.SuperAdminRequestOtpDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "requestSuperAdminOtp", null);
__decorate([
    (0, common_1.Post)('super-admin/otp/verify'),
    (0, swagger_1.ApiOperation)({ summary: 'Verify a super admin login OTP and sign in' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.SuperAdminVerifyOtpDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "verifySuperAdminOtp", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    (0, swagger_1.ApiOperation)({ summary: 'Request a password reset email' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.ForgotPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    (0, swagger_1.ApiOperation)({ summary: 'Complete a password reset using the emailed token' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.ResetPasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "resetPassword", null);
__decorate([
    (0, common_1.Post)('refresh-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Refresh access token' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.RefreshTokenDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refreshToken", null);
__decorate([
    (0, common_1.Post)('change-password'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Change password for authenticated user' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get current user profile' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Post)('update-profile'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update user profile (name, phone, avatar)' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateProfile", null);
exports.AuthController = AuthController = __decorate([
    (0, swagger_1.ApiTags)('Auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map