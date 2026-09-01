import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Parameter decorator that extracts the school_id from the request.
 * Usage: @SchoolId() schoolId: number
 */
export const SchoolId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): number => {
    const request = ctx.switchToHttp().getRequest();
    return request['school_id'] || request.user?.school_id;
  },
);
