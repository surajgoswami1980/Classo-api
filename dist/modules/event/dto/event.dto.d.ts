export declare class CreateEventDto {
    title: string;
    description?: string;
    category?: string;
    venue?: string;
    banner?: string;
    start_at: string;
    end_at?: string;
    registration_deadline?: string;
    is_paid?: boolean;
    fee?: number;
    capacity?: number;
    audience_type?: 'all' | 'class' | 'section';
    class_id?: number;
    section_id?: number;
}
export declare class UpdateEventDto extends CreateEventDto {
    status?: 'draft' | 'published' | 'cancelled' | 'completed';
}
export declare class ListEventsQueryDto {
    status?: string;
    category?: string;
    upcoming?: string;
    page?: number;
    limit?: number;
}
export declare class RegisterEventDto {
    event_id: number;
    name?: string;
    email?: string;
    phone?: string;
}
export declare class VerifyEventPaymentDto {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}
