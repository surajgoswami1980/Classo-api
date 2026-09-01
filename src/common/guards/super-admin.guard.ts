import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '../decorators/roles.decorator';

/**
 * Combines JWT authentication with a hard super-admin role check.
 * Used standalone on the /super-admin/* controller since those routes
 * have no school context (RolesGuard/PermissionsGuard assume one).
 */
@Injectable()
export class SuperAdminGuard extends AuthGuard('jwt') implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const authorized = (await super.canActivate(context)) as boolean;
    if (!authorized) return false;

    const request = context.switchToHttp().getRequest();
    if (request.user?.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super admin access required');
    }

    return true;
  }
}
