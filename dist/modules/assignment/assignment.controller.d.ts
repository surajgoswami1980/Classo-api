import { AssignmentService } from './assignment.service';
export declare class AssignmentController {
    private readonly assignmentService;
    constructor(assignmentService: AssignmentService);
    createAssignment(body: {
        class_id: number;
        section_id: number;
        subject_id: number;
        title: string;
        description?: string;
        due_date: string;
        max_marks?: number;
        attachment_url?: string;
        attachment_type?: string;
    }, schoolId: number, userId: number): Promise<{
        success: boolean;
        data: {
            id: number;
            message: string;
        };
    }>;
    listTeacherAssignments(schoolId: number, userId: number, classId?: number, sectionId?: number): Promise<{
        success: boolean;
        data: {
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
        }[];
    }>;
    listStudentAssignments(schoolId: number, userId: number): Promise<{
        success: boolean;
        data: {
            id: number;
            title: string;
            description: string;
            subject_id: number;
            due_date: Date;
            max_marks: number;
            attachment_url: string;
            created_at: Date;
        }[];
    }>;
    getAssignmentDetail(id: number, schoolId: number): Promise<{
        success: boolean;
        data: import("../../entities/assignment.entity").AssignmentEntity;
    }>;
    deleteAssignment(id: number, schoolId: number, userId: number): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
}
