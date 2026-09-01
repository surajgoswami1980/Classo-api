import { ReportService } from './report.service';
export declare class ReportController {
    private readonly reportService;
    constructor(reportService: ReportService);
    getAttendanceReport(schoolId: number, fromDate: string, toDate: string, classId?: number, sectionId?: number): Promise<{
        success: boolean;
        data: {
            by_class: any;
            summary: any;
        };
    }>;
    getFeeCollectionReport(schoolId: number, fromDate: string, toDate: string): Promise<{
        success: boolean;
        data: {
            by_class: any;
            summary: any;
        };
    }>;
    getExamPerformanceReport(schoolId: number, examId: number): Promise<{
        success: boolean;
        data: {
            exam: {
                id: number;
                name: string;
                exam_type: string;
            };
            by_subject: any;
        };
    }>;
    getStudentStrengthReport(schoolId: number): Promise<{
        success: boolean;
        data: {
            by_class: any;
            total_students: any;
        };
    }>;
}
