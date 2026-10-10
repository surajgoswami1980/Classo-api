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
exports.NotificationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const school_id_decorator_1 = require("../../common/decorators/school-id.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const notification_service_1 = require("./notification.service");
const notification_dto_1 = require("./dto/notification.dto");
let NotificationController = class NotificationController {
    constructor(notificationService) {
        this.notificationService = notificationService;
    }
    async sendNotification(body, schoolId, userId) {
        const result = await this.notificationService.sendNotification(schoolId, userId, body);
        return { success: true, data: result };
    }
    async listNotifications(query, schoolId, userId, userRole) {
        const result = await this.notificationService.listNotifications(schoolId, userRole, userId, query);
        return { success: true, data: result };
    }
    async registerToken(body, schoolId, userId) {
        const result = await this.notificationService.registerToken(schoolId ?? null, userId, body);
        return { success: true, data: result };
    }
    async unregisterToken(body, userId) {
        const result = await this.notificationService.unregisterToken(userId, body?.token);
        return { success: true, data: result };
    }
    async markAsRead(id, schoolId, userId) {
        const result = await this.notificationService.markAsRead(schoolId, id, userId);
        return { success: true, data: result };
    }
    async sendBulkNotification(body, schoolId, userId) {
        const result = await this.notificationService.sendBulkNotification(schoolId, userId, body);
        return { success: true, data: result };
    }
};
exports.NotificationController = NotificationController;
__decorate([
    (0, common_1.Post)('send'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.TEACHER, roles_decorator_1.UserRole.INCHARGE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.NOTIFICATION_SEND),
    (0, swagger_1.ApiOperation)({ summary: 'Send a notification' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, school_id_decorator_1.SchoolId)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [notification_dto_1.SendNotificationDto, Number, Number]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "sendNotification", null);
__decorate([
    (0, common_1.Get)('list'),
    (0, swagger_1.ApiOperation)({ summary: 'List notifications for current user' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, school_id_decorator_1.SchoolId)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __param(3, (0, current_user_decorator_1.CurrentUser)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [notification_dto_1.ListNotificationsQueryDto, Number, Number, String]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "listNotifications", null);
__decorate([
    (0, common_1.Post)('register-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Register this device\'s FCM push token for the current user' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, school_id_decorator_1.SchoolId)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [notification_dto_1.RegisterTokenDto, Number, Number]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "registerToken", null);
__decorate([
    (0, common_1.Post)('unregister-token'),
    (0, swagger_1.ApiOperation)({ summary: 'Deactivate a device token (on logout)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "unregisterToken", null);
__decorate([
    (0, common_1.Put)(':id/read'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark a notification as read for the current user' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, school_id_decorator_1.SchoolId)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Post)('send-bulk'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.TEACHER),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.NOTIFICATION_SEND),
    (0, swagger_1.ApiOperation)({ summary: 'Send bulk notification' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, school_id_decorator_1.SchoolId)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [notification_dto_1.SendBulkNotificationDto, Number, Number]),
    __metadata("design:returntype", Promise)
], NotificationController.prototype, "sendBulkNotification", null);
exports.NotificationController = NotificationController = __decorate([
    (0, swagger_1.ApiTags)('Notification'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('notification'),
    __metadata("design:paramtypes", [notification_service_1.NotificationService])
], NotificationController);
//# sourceMappingURL=notification.controller.js.map