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
exports.EventController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const school_id_decorator_1 = require("../../common/decorators/school-id.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const event_service_1 = require("./event.service");
const event_dto_1 = require("./dto/event.dto");
let EventController = class EventController {
    constructor(eventService) {
        this.eventService = eventService;
    }
    async create(schoolId, userId, dto) {
        const result = await this.eventService.createEvent(schoolId, dto, userId);
        return { success: true, data: result };
    }
    async update(schoolId, id, dto) {
        const result = await this.eventService.updateEvent(schoolId, id, dto);
        return { success: true, data: result };
    }
    async remove(schoolId, id) {
        const result = await this.eventService.deleteEvent(schoolId, id);
        return { success: true, data: result };
    }
    async publish(schoolId, userId, id) {
        const result = await this.eventService.publishEvent(schoolId, id, userId);
        return { success: true, data: result };
    }
    async adminList(schoolId, query) {
        const result = await this.eventService.listEventsAdmin(schoolId, query);
        return { success: true, ...result };
    }
    async registrations(schoolId, id) {
        const result = await this.eventService.listRegistrations(schoolId, id);
        return { success: true, data: result };
    }
    async list(schoolId, userId) {
        const result = await this.eventService.listEventsForStudent(schoolId, userId);
        return { success: true, data: result };
    }
    async register(schoolId, userId, dto) {
        const result = await this.eventService.register(schoolId, userId, dto);
        return { success: true, data: result };
    }
    async verify(schoolId, userId, dto) {
        const result = await this.eventService.verifyPayment(schoolId, userId, dto);
        return { success: true, data: result };
    }
    async myRegistrations(schoolId, userId) {
        const result = await this.eventService.myRegistrations(schoolId, userId);
        return { success: true, data: result };
    }
    async cancel(schoolId, userId, registrationId) {
        const result = await this.eventService.cancelRegistration(schoolId, userId, registrationId);
        return { success: true, data: result };
    }
};
exports.EventController = EventController;
__decorate([
    (0, common_1.Post)('create'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.EVENT_MANAGE),
    (0, swagger_1.ApiOperation)({ summary: 'Create an event' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, event_dto_1.CreateEventDto]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.EVENT_MANAGE),
    (0, swagger_1.ApiOperation)({ summary: 'Update an event' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, event_dto_1.UpdateEventDto]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.EVENT_MANAGE),
    (0, swagger_1.ApiOperation)({ summary: 'Delete an event' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('publish/:id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.EVENT_MANAGE),
    (0, swagger_1.ApiOperation)({ summary: 'Publish an event and notify the audience' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __param(2, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "publish", null);
__decorate([
    (0, common_1.Get)('admin/list'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.TEACHER, roles_decorator_1.UserRole.INCHARGE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.EVENT_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: list events with registration counts' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, event_dto_1.ListEventsQueryDto]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "adminList", null);
__decorate([
    (0, common_1.Get)(':id/registrations'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.TEACHER, roles_decorator_1.UserRole.INCHARGE),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.EVENT_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Admin: list registrations for an event' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "registrations", null);
__decorate([
    (0, common_1.Get)('list'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.STUDENT, roles_decorator_1.UserRole.PARENT),
    (0, swagger_1.ApiOperation)({ summary: 'Student: list published upcoming events' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "list", null);
__decorate([
    (0, common_1.Post)('register'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.STUDENT, roles_decorator_1.UserRole.PARENT),
    (0, swagger_1.ApiOperation)({ summary: 'Student: register for an event (free = instant, paid = Razorpay order)' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, event_dto_1.RegisterEventDto]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('payment/verify'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.STUDENT, roles_decorator_1.UserRole.PARENT),
    (0, swagger_1.ApiOperation)({ summary: 'Student: verify a paid-event Razorpay payment' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, event_dto_1.VerifyEventPaymentDto]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "verify", null);
__decorate([
    (0, common_1.Get)('my-registrations'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.STUDENT, roles_decorator_1.UserRole.PARENT),
    (0, swagger_1.ApiOperation)({ summary: "Student: my event registrations" }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "myRegistrations", null);
__decorate([
    (0, common_1.Delete)('register/:registrationId'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.STUDENT, roles_decorator_1.UserRole.PARENT),
    (0, swagger_1.ApiOperation)({ summary: 'Student: cancel a registration' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __param(2, (0, common_1.Param)('registrationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, Number]),
    __metadata("design:returntype", Promise)
], EventController.prototype, "cancel", null);
exports.EventController = EventController = __decorate([
    (0, swagger_1.ApiTags)('Event'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('event'),
    __metadata("design:paramtypes", [event_service_1.EventService])
], EventController);
//# sourceMappingURL=event.controller.js.map