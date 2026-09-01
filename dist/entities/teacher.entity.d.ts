import { UserEntity } from './user.entity';
export declare class TeacherEntity {
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
}
