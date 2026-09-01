import { CanActivate, ExecutionContext } from '@nestjs/common';
declare const SuperAdminGuard_base: import("@nestjs/passport").Type<import("@nestjs/passport").IAuthGuard>;
export declare class SuperAdminGuard extends SuperAdminGuard_base implements CanActivate {
    canActivate(context: ExecutionContext): Promise<boolean>;
}
export {};
