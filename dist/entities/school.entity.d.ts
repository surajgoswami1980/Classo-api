export declare class SchoolEntity {
    id: number;
    name: string;
    code: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    logo: string;
    website: string;
    board_affiliation: string;
    subscription_plan: string;
    subscription_start: Date;
    subscription_end: Date;
    max_students: number;
    settings: Record<string, any>;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}
