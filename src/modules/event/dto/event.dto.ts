// Plain DTO classes (no class-validator decorators) — consistent with the
// rest of the codebase and the global ValidationPipe config.

export class CreateEventDto {
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

export class UpdateEventDto extends CreateEventDto {
  status?: 'draft' | 'published' | 'cancelled' | 'completed';
}

export class ListEventsQueryDto {
  status?: string;
  category?: string;
  upcoming?: string;
  page?: number;
  limit?: number;
}

export class RegisterEventDto {
  event_id: number;
  // student payer contact (for the Razorpay prefill on paid events)
  name?: string;
  email?: string;
  phone?: string;
}

export class VerifyEventPaymentDto {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
