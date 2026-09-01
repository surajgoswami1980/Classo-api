import { Repository } from 'typeorm';
import { StudentEntity } from '../../entities/student.entity';
import { UserEntity } from '../../entities/user.entity';
import { ClassEntity } from '../../entities/class.entity';
import { SectionEntity } from '../../entities/section.entity';
import { SpatieRoleService } from '../../common/providers/spatie-role.service';
import { CreateStudentDto, UpdateStudentDto, ListStudentsQueryDto, PromoteStudentsDto } from './dto/student.dto';
export declare class StudentService {
    private studentRepo;
    private userRepo;
    private classRepo;
    private sectionRepo;
    private spatieRole;
    constructor(studentRepo: Repository<StudentEntity>, userRepo: Repository<UserEntity>, classRepo: Repository<ClassEntity>, sectionRepo: Repository<SectionEntity>, spatieRole: SpatieRoleService);
    listStudents(schoolId: number, query: ListStudentsQueryDto): Promise<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        total_pages: number;
    }>;
    createStudent(schoolId: number, dto: CreateStudentDto): Promise<{
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
        user: UserEntity;
    }>;
    bulkImportStudents(schoolId: number, fileBuffer: Buffer): Promise<{
        total: number;
        created: number;
        failed: number;
        errors: {
            row: number;
            error: string;
        }[];
    }>;
    getStudentDetail(schoolId: number, id: number): Promise<any>;
    updateStudent(schoolId: number, id: number, dto: UpdateStudentDto): Promise<any>;
    promoteStudents(schoolId: number, dto: PromoteStudentsDto): Promise<{
        message: string;
        promoted: number;
        skipped: number;
        skipped_ids: number[];
    }>;
    getStudentDashboard(schoolId: number, userId: number): Promise<{
        today_timetable: any;
        attendance_summary: {
            present: number;
            absent: number;
            late: number;
            total_marked_days: any;
        };
        upcoming_assignments: any;
    }>;
    private assertClassAndSection;
    private parseCsv;
}
