export declare class CreateSchoolDto {
    name: string;
    code: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    board_affiliation?: string;
    subscription_plan?: 'trial' | 'basic' | 'standard' | 'premium' | 'enterprise';
    max_students?: number;
    logo?: string;
    admin_name: string;
    admin_email: string;
    admin_phone?: string;
    admin_password?: string;
}
export declare class ToggleSchoolStatusDto {
    school_id: number;
    is_active: boolean;
}
export declare class ListSchoolsQueryDto {
    search?: string;
    subscription_plan?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
}
