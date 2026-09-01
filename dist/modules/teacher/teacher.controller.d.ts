import { TeacherService } from './teacher.service';
import { CreateTeacherDto, UpdateTeacherDto, ListTeachersQueryDto } from './dto/teacher.dto';
export declare class TeacherController {
    private readonly teacherService;
    constructor(teacherService: TeacherService);
    listTeachers(query: ListTeachersQueryDto, schoolId: number): Promise<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        total_pages: number;
        success: boolean;
    }>;
    createTeacher(dto: CreateTeacherDto, schoolId: number): Promise<{
        success: boolean;
        data: {
            name: string;
            email: string;
            phone: string;
            temp_password: string;
            id: number;
            school_id: number;
            user_id: number;
            qualifications: string;
            date_of_joining: Date;
            designation: string;
            department: string;
            salary: number;
            status: string;
            date_of_leaving: Date;
            assigned_classes: number[];
            assigned_subjects: number[];
            created_at: Date;
            updated_at: Date;
            user: import("../../entities/user.entity").UserEntity;
        };
    }>;
    getTeacherDetail(id: number, schoolId: number, userId: number, role: string): Promise<{
        success: boolean;
        data: any;
    }>;
    getTeacherWorkload(id: number, schoolId: number, userId: number, role: string): Promise<{
        success: boolean;
        data: {
            teacher_id: number;
            total_periods_per_week: any;
            distinct_classes: number;
            periods: any;
        };
    }>;
    updateTeacher(id: number, dto: UpdateTeacherDto, schoolId: number): Promise<{
        success: boolean;
        data: any;
    }>;
}
