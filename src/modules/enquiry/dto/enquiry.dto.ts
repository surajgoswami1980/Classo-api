export class CreateEnquiryDto {
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  city?: string;
  student_count?: number;
  subject?: string;
  message?: string;
  source?: string;
}
