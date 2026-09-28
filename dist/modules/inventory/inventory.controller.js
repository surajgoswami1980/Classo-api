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
exports.InventoryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const school_id_decorator_1 = require("../../common/decorators/school-id.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const inventory_service_1 = require("./inventory.service");
const inventory_dto_1 = require("./dto/inventory.dto");
let InventoryController = class InventoryController {
    constructor(inventoryService) {
        this.inventoryService = inventoryService;
    }
    async dashboard(schoolId) {
        const result = await this.inventoryService.getDashboard(schoolId);
        return { success: true, data: result };
    }
    async listCategories(schoolId) {
        const result = await this.inventoryService.listCategories(schoolId);
        return { success: true, data: result };
    }
    async createCategory(schoolId, dto) {
        const result = await this.inventoryService.createCategory(schoolId, dto);
        return { success: true, data: result };
    }
    async listItems(schoolId, query) {
        const result = await this.inventoryService.listItems(schoolId, query);
        return { success: true, ...result };
    }
    async createItem(schoolId, dto) {
        const result = await this.inventoryService.createItem(schoolId, dto);
        return { success: true, data: result };
    }
    async updateItem(schoolId, id, dto) {
        const result = await this.inventoryService.updateItem(schoolId, id, dto);
        return { success: true, data: result };
    }
    async recordTransaction(schoolId, userId, dto) {
        const result = await this.inventoryService.recordTransaction(schoolId, dto, userId);
        return { success: true, data: result };
    }
    async listTransactions(schoolId, itemId) {
        const result = await this.inventoryService.listTransactions(schoolId, itemId ? Number(itemId) : undefined);
        return { success: true, data: result };
    }
};
exports.InventoryController = InventoryController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.INVENTORY_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Inventory dashboard totals' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Get)('category/list'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.INVENTORY_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'List inventory categories' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "listCategories", null);
__decorate([
    (0, common_1.Post)('category/create'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.STAFF),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.INVENTORY_MANAGE),
    (0, swagger_1.ApiOperation)({ summary: 'Create an inventory category' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, inventory_dto_1.CreateCategoryDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "createCategory", null);
__decorate([
    (0, common_1.Get)('item/list'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.INVENTORY_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'List items (search / low-stock filters)' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, inventory_dto_1.ListItemsQueryDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "listItems", null);
__decorate([
    (0, common_1.Post)('item/create'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.STAFF),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.INVENTORY_MANAGE),
    (0, swagger_1.ApiOperation)({ summary: 'Add an inventory item' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, inventory_dto_1.CreateItemDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "createItem", null);
__decorate([
    (0, common_1.Put)('item/:id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.STAFF),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.INVENTORY_MANAGE),
    (0, swagger_1.ApiOperation)({ summary: 'Update an inventory item' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, inventory_dto_1.UpdateItemDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "updateItem", null);
__decorate([
    (0, common_1.Post)('stock/transaction'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.STAFF),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.INVENTORY_MANAGE),
    (0, swagger_1.ApiOperation)({ summary: 'Record a stock in/out movement' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)('user_id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, inventory_dto_1.StockTransactionDto]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "recordTransaction", null);
__decorate([
    (0, common_1.Get)('stock/transactions'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.INVENTORY_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'List recent stock movements' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __param(1, (0, common_1.Query)('item_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", Promise)
], InventoryController.prototype, "listTransactions", null);
exports.InventoryController = InventoryController = __decorate([
    (0, swagger_1.ApiTags)('Inventory'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('inventory'),
    __metadata("design:paramtypes", [inventory_service_1.InventoryService])
], InventoryController);
//# sourceMappingURL=inventory.controller.js.map