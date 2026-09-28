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
exports.HostelController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const school_id_decorator_1 = require("../../common/decorators/school-id.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const hostel_service_1 = require("./hostel.service");
const hostel_dto_1 = require("./dto/hostel.dto");
let HostelController = class HostelController {
    constructor(hostelService) {
        this.hostelService = hostelService;
    }
    async getMyHostel(schoolId, userId) {
        const result = await this.hostelService.getMyHostel(schoolId, userId);
        return { success: true, data: result };
    }
    async listBlocks(schoolId) {
        const result = await this.hostelService.listBlocks(schoolId);
        return { success: true, data: result };
    }
    async createBlock(schoolId, dto) {
        const result = await this.hostelService.createBlock(schoolId, dto);
        return { success: true, data: result };
    }
    async listRooms(schoolId, blockId) {
        const result = await this.hostelService.listRooms(schoolId, blockId ? Number(blockId) : undefined);
        return { success: true, data: result };
    }
    async createRoom(schoolId, dto) {
        const result = await this.hostelService.createRoom(schoolId, dto);
        return { success: true, data: result };
    }
    async listAllocations(schoolId, roomId) {
        const result = await this.hostelService.listAllocations(schoolId, roomId ? Number(roomId) : undefined);
        return { success: true, data: result };
    }
    async allocate(schoolId, dto) {
        const result = await this.hostelService.allocate(schoolId, dto);
        return { success: true, data: result };
    }
    async vacate(schoolId, id) {
        const result = await this.hostelService.vacate(schoolId, id);
        return { success: true, data: result };
    }
};
exports.HostelController = HostelController;
__decorate([
    (0, common_1.Get)('my'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.STUDENT, roles_decorator_1.UserRole.PARENT),
    (0, swagger_1.ApiOperation)({ summary: "A student's own hostel allocation" }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], HostelController.prototype, "getMyHostel", null);
__decorate([
    (0, common_1.Get)('block/list'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.HOSTEL_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'List hostel blocks with occupancy' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], HostelController.prototype, "listBlocks", null);
__decorate([
    (0, common_1.Post)('block/create'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.HOSTEL_MANAGE),
    (0, swagger_1.ApiOperation)({ summary: 'Create a hostel block' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, hostel_dto_1.CreateBlockDto]),
    __metadata("design:returntype", Promise)
], HostelController.prototype, "createBlock", null);
__decorate([
    (0, common_1.Get)('room/list'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.HOSTEL_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'List hostel rooms with occupancy' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Query)('block_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], HostelController.prototype, "listRooms", null);
__decorate([
    (0, common_1.Post)('room/create'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.HOSTEL_MANAGE),
    (0, swagger_1.ApiOperation)({ summary: 'Create a hostel room' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, hostel_dto_1.CreateRoomDto]),
    __metadata("design:returntype", Promise)
], HostelController.prototype, "createRoom", null);
__decorate([
    (0, common_1.Get)('allocation/list'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.HOSTEL_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'List active allocations' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Query)('room_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], HostelController.prototype, "listAllocations", null);
__decorate([
    (0, common_1.Post)('allocation/create'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.HOSTEL_MANAGE),
    (0, swagger_1.ApiOperation)({ summary: 'Allocate a student to a room' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, hostel_dto_1.AllocateRoomDto]),
    __metadata("design:returntype", Promise)
], HostelController.prototype, "allocate", null);
__decorate([
    (0, common_1.Delete)('allocation/:id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.HOSTEL_MANAGE),
    (0, swagger_1.ApiOperation)({ summary: 'Vacate an allocation' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], HostelController.prototype, "vacate", null);
exports.HostelController = HostelController = __decorate([
    (0, swagger_1.ApiTags)('Hostel'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('hostel'),
    __metadata("design:paramtypes", [hostel_service_1.HostelService])
], HostelController);
//# sourceMappingURL=hostel.controller.js.map