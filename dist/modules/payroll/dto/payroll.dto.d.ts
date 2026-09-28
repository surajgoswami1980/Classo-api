export declare class SalaryStructureDto {
    user_id: number;
    basic?: number;
    hra?: number;
    allowances?: number;
    deductions?: number;
}
export declare class GeneratePayslipDto {
    user_id: number;
    month: number;
    year: number;
    lop_days?: number;
    extra_deductions?: number;
    remarks?: string;
}
export declare class MarkPaidDto {
    payslip_id: number;
    paid_on?: string;
}
