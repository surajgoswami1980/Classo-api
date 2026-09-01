import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, Permission } from '../decorators/permissions.decorator';
import { UserRole } from '../decorators/roles.decorator';

/**
 * Permission guard — checks if the authenticated user has the required
 * permissions. School Admin and Super Admin bypass permission checks.
 * Sub-admins, incharges, and staff have granular permissions stored in DB.
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Super Admin and School Admin bypass permission checks
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.SCHOOL_ADMIN) {
      return true;
    }

    // Teachers bypass permission checks for their core capabilities
    if (user.role === UserRole.TEACHER || user.role === UserRole.INCHARGE) {
      const teacherPermissions = [
        'attendance.view', 'attendance.mark', 'attendance.report',
        'exam.view', 'exam.marks_entry',
        'assignment.view', 'assignment.create', 'assignment.grade',
        'timetable.view',
        'notification.send', 'notification.view',
        'student.view',
        'teacher.view', // a teacher viewing their own profile/workload
        'transport.view', // a teacher viewing routes (e.g. a class incharge coordinating pickup)
      ];
      const hasTeacherPermission = requiredPermissions.some((perm) =>
        teacherPermissions.includes(perm),
      );
      if (hasTeacherPermission) return true;
    }

    // Check user's permissions array from JWT payload
    const userPermissions: string[] = user.permissions || [];
    const hasPermission = requiredPermissions.some((perm) =>
      userPermissions.includes(perm),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'You do not have permission to perform this action',
      );
    }

    return true;
  }
}
