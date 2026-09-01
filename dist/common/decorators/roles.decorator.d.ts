export declare enum UserRole {
    SUPER_ADMIN = "super_admin",
    SCHOOL_ADMIN = "school_admin",
    SUB_ADMIN = "sub_admin",
    TEACHER = "teacher",
    STUDENT = "student",
    PARENT = "parent",
    STAFF = "staff",
    INCHARGE = "incharge"
}
export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: UserRole[]) => import("@nestjs/common").CustomDecorator<string>;
