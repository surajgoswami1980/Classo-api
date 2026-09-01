export declare class PaymentTransactionEntity {
    id: number;
    school_id: number;
    fee_invoice_id: number;
    student_id: number;
    parent_user_id: number;
    amount: number;
    payment_method: string;
    gateway: string;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    status: string;
    failure_reason: string;
    receipt_url: string;
    platform_commission: number;
    created_at: Date;
    updated_at: Date;
}
