export declare class FeeInvoiceEntity {
    id: number;
    school_id: number;
    student_id: number;
    fee_structure_id: number;
    fee_installment_id: number;
    invoice_number: string;
    amount: number;
    late_fee: number;
    total_amount: number;
    status: string;
    due_date: Date;
    paid_date: Date;
    created_at: Date;
    updated_at: Date;
}
