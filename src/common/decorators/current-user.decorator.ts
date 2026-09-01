import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Parameter decorator to get the current authenticated user.
 * Usage: @CurrentUser() user: JwtPayload
 */
export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
