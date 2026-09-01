export declare class SchoolLookupDto {
    school_code: string;
}
export declare class LoginDto {
    school_code: string;
    identifier: string;
    password: string;
    platform?: string;
}
export declare class SuperAdminLoginDto {
    identifier: string;
    password: string;
}
export declare class ForgotPasswordDto {
    school_code: string;
    identifier: string;
}
export declare class ResetPasswordDto {
    token: string;
    new_password: string;
}
export declare class RefreshTokenDto {
    refresh_token: string;
}
