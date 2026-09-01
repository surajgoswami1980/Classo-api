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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PermissionsGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const permissions_decorator_1 = require("../decorators/permissions.decorator");
const roles_decorator_1 = require("../decorators/roles.decorator");
let PermissionsGuard = class PermissionsGuard {
    constructor(reflector) {
        this.reflector = reflector;
    }
    canActivate(context) {
        const requiredPermissions = this.reflector.getAllAndOverride(permissions_decorator_1.PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.ForbiddenException('Authentication required');
        }
        if (user.role === roles_decorator_1.UserRole.SUPER_ADMIN || user.role === roles_decorator_1.UserRole.SCHOOL_ADMIN) {
            return true;
        }
        if (user.role === roles_decorator_1.UserRole.TEACHER || user.role === roles_decorator_1.UserRole.INCHARGE) {
            const teacherPermissions = [
                'attendance.view', 'attendance.mark', 'attendance.report',
                'exam.view', 'exam.marks_entry',
                'assignment.view', 'assignment.create', 'assignment.grade',
                'timetable.view',
                'notification.send', 'notification.view',
                'student.view',
                'teacher.view',
                'transport.view',
            ];
            const hasTeacherPermission = requiredPermissions.some((perm) => teacherPermissions.includes(perm));
            if (hasTeacherPermission)
                return true;
        }
        const userPermissions = user.permissions || [];
        const hasPermission = requiredPermissions.some((perm) => userPermissions.includes(perm));
        if (!hasPermission) {
            throw new common_1.ForbiddenException('You do not have permission to perform this action');
        }
        return true;
    }
};
exports.PermissionsGuard = PermissionsGuard;
exports.PermissionsGuard = PermissionsGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector])
], PermissionsGuard);
//# sourceMappingURL=permissions.guard.js.map