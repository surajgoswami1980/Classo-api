import { StudentService } from './student.service';
import { CreateStudentDto, UpdateStudentDto, ListStudentsQueryDto, PromoteStudentsDto } from './dto/student.dto';
export declare class StudentController {
    private readonly studentService;
    constructor(studentService: StudentService);
    listStudents(query: ListStudentsQueryDto, schoolId: number): Promise<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        total_pages: number;
        success: boolean;
    }>;
    createStudent(dto: CreateStudentDto, schoolId: number): Promise<{
        success: boolean;
        data: {
            name: string;
            email: string;
            phone: string;
            temp_password: string;
            id: number;
            school_id: number;
            user_id: number;
            admission_number: string;
            class_id: number;
            section_id: number;
            roll_number: string;
            date_of_birth: Date;
            gender: string;
            blood_group: string;
            address: string;
            city: string;
            state: string;
            pincode: string;
            admission_date: Date;
            status: string;
            previous_school: string;
            transport_route_id: number;
            father_name: string;
            father_phone: string;
            mother_name: string;
            mother_phone: string;
            guardian_name: string;
            guardian_phone: string;
            medical_conditions: string;
            created_at: Date;
            updated_at: Date;
            user: import("../../entities/user.entity").UserEntity;
        };
    }>;
    bulkImportStudents(file: Express.Multer.File, schoolId: number): Promise<{
        success: boolean;
        data: {
            total: number;
            created: number;
            failed: number;
            errors: {
                row: number;
                error: string;
            }[];
        };
    }>;
    getStudentDashboard(userId: number, schoolId: number): Promise<{
        success: boolean;
        data: {
            today_timetable: any;
            attendance_summary: {
                present: number;
                absent: number;
                late: number;
                total_marked_days: any;
            };
            upcoming_assignments: any;
        };
    }>;
    getStudentDetail(id: number, schoolId: number): Promise<{
        success: boolean;
        data: any;
    }>;
    updateStudent(id: number, dto: UpdateStudentDto, schoolId: number): Promise<{
        success: boolean;
        data: any;
    }>;
    promoteStudents(dto: PromoteStudentsDto, schoolId: number): Promise<{
        success: boolean;
        data: {
            message: string;
            promoted: number;
            skipped: number;
            skipped_ids: number[];
        };
    }>;
}
