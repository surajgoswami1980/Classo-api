export class CreateStudentDto {
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  class_id: number;
  section_id: number;
  admission_number?: string;
  roll_number?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  blood_group?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  admission_date?: string;
  father_name?: string;
  father_phone?: string;
  mother_name?: string;
  mother_phone?: string;
  guardian_name?: string;
  guardian_phone?: string;
}

export class UpdateStudentDto {
  name?: string;
  email?: string;
  phone?: string;
  class_id?: number;
  section_id?: number;
  admission_number?: string;
  roll_number?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female' | 'other';
  blood_group?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  father_name?: string;
  father_phone?: string;
  mother_name?: string;
  mother_phone?: string;
  status?: 'active' | 'inactive' | 'transferred' | 'graduated';
}

export class ListStudentsQueryDto {
  class_id?: number;
  section_id?: number;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class PromoteStudentsDto {
  student_ids: number[];
  to_class_id: number;
  to_section_id: number;
}
