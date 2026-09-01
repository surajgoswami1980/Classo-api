export declare class FeeStructureEntity {
    id: number;
    school_id: number;
    academic_session_id: number;
    name: string;
    class_id: number;
    total_amount: number;
    installment_count: number;
    late_fee_per_day: number;
    late_fee_max: number;
    is_active: number;
    created_at: Date;
    updated_at: Date;
}
