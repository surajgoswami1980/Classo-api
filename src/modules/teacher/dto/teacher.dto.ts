export class CreateTeacherDto {
  name: string;
  email?: string;
  phone?: string;
  password?: string;
  employee_id?: string;
  qualifications?: string;
  date_of_joining?: string;
  designation?: string;
  department?: string;
  salary?: number;
  assigned_classes?: number[];
  assigned_subjects?: number[];
}

export class UpdateTeacherDto {
  name?: string;
  email?: string;
  phone?: string;
  employee_id?: string;
  qualifications?: string;
  designation?: string;
  department?: string;
  salary?: number;
  assigned_classes?: number[];
  assigned_subjects?: number[];
  status?: 'active' | 'inactive' | 'resigned';
  date_of_leaving?: string;
}

export class ListTeachersQueryDto {
  status?: string;
  department?: string;
  search?: string;
  page?: number;
  limit?: number;
}
