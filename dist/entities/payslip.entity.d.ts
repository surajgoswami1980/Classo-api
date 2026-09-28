export declare class PayslipEntity {
    id: number;
    school_id: number;
    user_id: number;
    month: number;
    year: number;
    basic: number;
    hra: number;
    allowances: number;
    deductions: number;
    lop_days: number;
    gross: number;
    net: number;
    status: string;
    paid_on: Date;
    remarks: string;
    created_at: Date;
    updated_at: Date;
}
