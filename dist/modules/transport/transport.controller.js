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
exports.TransportController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const school_id_decorator_1 = require("../../common/decorators/school-id.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const transport_service_1 = require("./transport.service");
const transport_dto_1 = require("./dto/transport.dto");
let TransportController = class TransportController {
    constructor(transportService) {
        this.transportService = transportService;
    }
    async getMyTransport(schoolId, userId) {
        const result = await this.transportService.getMyTransport(schoolId, userId);
        return { success: true, data: result };
    }
    async listRoutes(schoolId) {
        const result = await this.transportService.listRoutes(schoolId);
        return { success: true, data: result };
    }
    async createRoute(dto, schoolId) {
        const result = await this.transportService.createRoute(schoolId, dto);
        return { success: true, data: result };
    }
    async addStop(dto, schoolId) {
        const result = await this.transportService.addStop(schoolId, dto);
        return { success: true, data: result };
    }
    async listStops(routeId, schoolId) {
        const result = await this.transportService.listStops(schoolId, routeId);
        return { success: true, data: result };
    }
    async listVehicles(schoolId) {
        const result = await this.transportService.listVehicles(schoolId);
        return { success: true, data: result };
    }
    async createVehicle(dto, schoolId) {
        const result = await this.transportService.createVehicle(schoolId, dto);
        return { success: true, data: result };
    }
    async getExpiringDocuments(days, schoolId) {
        const result = await this.transportService.getExpiringDocuments(schoolId, days ? Number(days) : 30);
        return { success: true, data: result };
    }
    async assignStudent(dto, schoolId) {
        const result = await this.transportService.assignStudent(schoolId, dto);
        return { success: true, data: result };
    }
};
exports.TransportController = TransportController;
__decorate([
    (0, common_1.Get)('my'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.STUDENT, roles_decorator_1.UserRole.PARENT),
    (0, swagger_1.ApiOperation)({ summary: "A student's own transport assignment — route, stop, driver, vehicle" }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], TransportController.prototype, "getMyTransport", null);
__decorate([
    (0, common_1.Get)('route/list'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.TRANSPORT_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'List routes with vehicle info and student counts' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TransportController.prototype, "listRoutes", null);
__decorate([
    (0, common_1.Post)('route/create'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.TRANSPORT_MANAGE),
    (0, swagger_1.ApiOperation)({ summary: 'Create a transport route' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [transport_dto_1.CreateRouteDto, Number]),
    __metadata("design:returntype", Promise)
], TransportController.prototype, "createRoute", null);
__decorate([
    (0, common_1.Post)('stop/create'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.TRANSPORT_MANAGE),
    (0, swagger_1.ApiOperation)({ summary: 'Add a stop to a route' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [transport_dto_1.CreateStopDto, Number]),
    __metadata("design:returntype", Promise)
], TransportController.prototype, "addStop", null);
__decorate([
    (0, common_1.Get)('route/:routeId/stops'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.TRANSPORT_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'List stops for a route, in sequence' }),
    __param(0, (0, common_1.Param)('routeId')),
    __param(1, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], TransportController.prototype, "listStops", null);
__decorate([
    (0, common_1.Get)('vehicle/list'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.TRANSPORT_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'List vehicles' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], TransportController.prototype, "listVehicles", null);
__decorate([
    (0, common_1.Post)('vehicle/create'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.TRANSPORT_MANAGE),
    (0, swagger_1.ApiOperation)({ summary: 'Add a vehicle' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [transport_dto_1.CreateVehicleDto, Number]),
    __metadata("design:returntype", Promise)
], TransportController.prototype, "createVehicle", null);
__decorate([
    (0, common_1.Get)('vehicle/expiring'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.TRANSPORT_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Vehicles with insurance/fitness expiring within 30 days' }),
    __param(0, (0, common_1.Query)('days')),
    __param(1, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], TransportController.prototype, "getExpiringDocuments", null);
__decorate([
    (0, common_1.Post)('student/assign'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.TRANSPORT_MANAGE),
    (0, swagger_1.ApiOperation)({ summary: 'Assign a student to a transport route and stop' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [transport_dto_1.AssignStudentTransportDto, Number]),
    __metadata("design:returntype", Promise)
], TransportController.prototype, "assignStudent", null);
exports.TransportController = TransportController = __decorate([
    (0, swagger_1.ApiTags)('Transport'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('transport'),
    __metadata("design:paramtypes", [transport_service_1.TransportService])
], TransportController);
//# sourceMappingURL=transport.controller.js.map