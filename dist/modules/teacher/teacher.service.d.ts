import { Repository } from 'typeorm';
import { TeacherEntity } from '../../entities/teacher.entity';
import { UserEntity } from '../../entities/user.entity';
import { SpatieRoleService } from '../../common/providers/spatie-role.service';
import { CreateTeacherDto, UpdateTeacherDto, ListTeachersQueryDto } from './dto/teacher.dto';
export declare class TeacherService {
    private teacherRepo;
    private userRepo;
    private spatieRole;
    constructor(teacherRepo: Repository<TeacherEntity>, userRepo: Repository<UserEntity>, spatieRole: SpatieRoleService);
    listTeachers(schoolId: number, query: ListTeachersQueryDto): Promise<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        total_pages: number;
    }>;
    createTeacher(schoolId: number, dto: CreateTeacherDto): Promise<{
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
        user: UserEntity;
    }>;
    getTeacherDetail(schoolId: number, id: number, requestingUserId?: number, requestingRole?: string): Promise<any>;
    getTeacherWorkload(schoolId: number, id: number, requestingUserId?: number, requestingRole?: string): Promise<{
        teacher_id: number;
        total_periods_per_week: any;
        distinct_classes: number;
        periods: any;
    }>;
    updateTeacher(schoolId: number, id: number, dto: UpdateTeacherDto): Promise<any>;
    private assertCanView;
}
