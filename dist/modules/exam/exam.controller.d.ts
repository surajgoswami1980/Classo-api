import { Response } from 'express';
import { ExamService, CreateExamDto, EnterMarksDto } from './exam.service';
import { ReportCardPdfService } from '../report/report-card-pdf.service';
export declare class ExamController {
    private readonly examService;
    private readonly reportCardPdf;
    constructor(examService: ExamService, reportCardPdf: ReportCardPdfService);
    createExam(schoolId: number, dto: CreateExamDto): Promise<{
        success: boolean;
        data: import("../../entities/exam.entity").ExamEntity;
    }>;
    listExams(schoolId: number, sessionId?: number): Promise<{
        success: boolean;
        data: import("../../entities/exam.entity").ExamEntity[];
    }>;
    getExamSubjects(schoolId: number, examId: number, classId: number): Promise<{
        success: boolean;
        data: any;
    }>;
    getMarksEntryData(schoolId: number, examId: number, examSubjectId: number, classId: number, sectionId: number): Promise<{
        success: boolean;
        data: {
            students: {
                student_id: number;
                roll_number: string;
                name: string;
                marks_obtained: number;
                grade: string;
                remarks: string;
            }[];
            total_students: number;
            marks_entered: number;
        };
    }>;
    enterMarks(schoolId: number, userId: number, dto: EnterMarksDto): Promise<{
        success: boolean;
        data: {
            message: string;
            exam_id: number;
            exam_subject_id: number;
        };
    }>;
    publishExam(schoolId: number, examId: number): Promise<{
        success: boolean;
        data: {
            message: string;
            exam_id: number;
        };
    }>;
    getReportCard(schoolId: number, studentId: number, examId: number): Promise<{
        success: boolean;
        data: unknown;
    }>;
    getReportCardPdf(schoolId: number, studentId: number, examId: number, res: Response): Promise<void>;
    getResultAnalysis(schoolId: number, examId: number, classId: number): Promise<{
        success: boolean;
        data: any;
    }>;
}
