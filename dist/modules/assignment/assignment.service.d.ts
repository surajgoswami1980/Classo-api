import { Repository } from 'typeorm';
import { AssignmentEntity } from '../../entities/assignment.entity';
import { StudentEntity } from '../../entities/student.entity';
export declare class AssignmentService {
    private assignmentRepo;
    private studentRepo;
    constructor(assignmentRepo: Repository<AssignmentEntity>, studentRepo: Repository<StudentEntity>);
    createAssignment(schoolId: number, teacherId: number, data: {
        class_id: number;
        section_id: number;
        subject_id: number;
        title: string;
        description?: string;
        due_date: string;
        max_marks?: number;
        attachment_url?: string;
        attachment_type?: string;
    }): Promise<{
        id: number;
        message: string;
    }>;
    listTeacherAssignments(schoolId: number, teacherId: number, query?: {
        class_id?: number;
        section_id?: number;
    }): Promise<{
        id: number;
        title: string;
        description: string;
        class_id: number;
        section_id: number;
        subject_id: number;
        due_date: Date;
        max_marks: number;
        status: string;
        created_at: Date;
    }[]>;
    listStudentAssignments(schoolId: number, userId: number): Promise<{
        id: number;
        title: string;
        description: string;
        subject_id: number;
        due_date: Date;
        max_marks: number;
        attachment_url: string;
        created_at: Date;
    }[]>;
    getAssignment(schoolId: number, assignmentId: number): Promise<AssignmentEntity>;
    deleteAssignment(schoolId: number, assignmentId: number, teacherId: number): Promise<{
        message: string;
    }>;
}
