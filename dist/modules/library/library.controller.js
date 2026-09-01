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
exports.LibraryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const permissions_guard_1 = require("../../common/guards/permissions.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const permissions_decorator_1 = require("../../common/decorators/permissions.decorator");
const school_id_decorator_1 = require("../../common/decorators/school-id.decorator");
const library_service_1 = require("./library.service");
const library_dto_1 = require("./dto/library.dto");
let LibraryController = class LibraryController {
    constructor(libraryService) {
        this.libraryService = libraryService;
    }
    async listBooks(query, schoolId) {
        const result = await this.libraryService.listBooks(schoolId, query);
        return { success: true, ...result };
    }
    async createBook(dto, schoolId) {
        const result = await this.libraryService.createBook(schoolId, dto);
        return { success: true, data: result };
    }
    async updateBook(id, dto, schoolId) {
        const result = await this.libraryService.updateBook(schoolId, id, dto);
        return { success: true, data: result };
    }
    async issueBook(dto, schoolId) {
        const result = await this.libraryService.issueBook(schoolId, dto);
        return { success: true, data: result };
    }
    async returnBook(dto, schoolId) {
        const result = await this.libraryService.returnBook(schoolId, dto.issue_id);
        return { success: true, data: result };
    }
    async getDashboard(schoolId) {
        const result = await this.libraryService.getDashboard(schoolId);
        return { success: true, data: result };
    }
};
exports.LibraryController = LibraryController;
__decorate([
    (0, common_1.Get)('book/list'),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.LIBRARY_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'List/search the book catalog' }),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [library_dto_1.ListBooksQueryDto, Number]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "listBooks", null);
__decorate([
    (0, common_1.Post)('book/create'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.STAFF),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.LIBRARY_MANAGE),
    (0, swagger_1.ApiOperation)({ summary: 'Add a book to the catalog' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [library_dto_1.CreateBookDto, Number]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "createBook", null);
__decorate([
    (0, common_1.Put)('book/:id'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.STAFF),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.LIBRARY_MANAGE),
    (0, swagger_1.ApiOperation)({ summary: 'Update a book' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, library_dto_1.UpdateBookDto, Number]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "updateBook", null);
__decorate([
    (0, common_1.Post)('book/issue'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.STAFF),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.LIBRARY_ISSUE),
    (0, swagger_1.ApiOperation)({ summary: 'Issue a book to a student or staff member' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [library_dto_1.IssueBookDto, Number]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "issueBook", null);
__decorate([
    (0, common_1.Post)('book/return'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.STAFF),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.LIBRARY_ISSUE),
    (0, swagger_1.ApiOperation)({ summary: 'Return a book and settle any overdue fine' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [library_dto_1.ReturnBookDto, Number]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "returnBook", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, roles_decorator_1.Roles)(roles_decorator_1.UserRole.SCHOOL_ADMIN, roles_decorator_1.UserRole.SUB_ADMIN, roles_decorator_1.UserRole.STAFF),
    (0, permissions_decorator_1.RequirePermissions)(permissions_decorator_1.Permission.LIBRARY_VIEW),
    (0, swagger_1.ApiOperation)({ summary: 'Library dashboard — totals, issued, overdue, fine collected' }),
    __param(0, (0, school_id_decorator_1.SchoolId)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], LibraryController.prototype, "getDashboard", null);
exports.LibraryController = LibraryController = __decorate([
    (0, swagger_1.ApiTags)('Library'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard, permissions_guard_1.PermissionsGuard),
    (0, common_1.Controller)('library'),
    __metadata("design:paramtypes", [library_service_1.LibraryService])
], LibraryController);
//# sourceMappingURL=library.controller.js.map