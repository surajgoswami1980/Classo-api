import { Repository } from 'typeorm';
import { StudentEntity } from '../../entities/student.entity';
import { ExamEntity } from '../../entities/exam.entity';
export declare class ReportService {
    private studentRepo;
    private examRepo;
    constructor(studentRepo: Repository<StudentEntity>, examRepo: Repository<ExamEntity>);
    getAttendanceReport(schoolId: number, fromDate: string, toDate: string, classId?: number, sectionId?: number): Promise<{
        by_class: any;
        summary: any;
    }>;
    getFeeCollectionReport(schoolId: number, fromDate: string, toDate: string): Promise<{
        by_class: any;
        summary: any;
    }>;
    getExamPerformanceReport(schoolId: number, examId: number): Promise<{
        exam: {
            id: number;
            name: string;
            exam_type: string;
        };
        by_subject: any;
    }>;
    getStudentStrengthReport(schoolId: number): Promise<{
        by_class: any;
        total_students: any;
    }>;
}
