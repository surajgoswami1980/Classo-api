import { ConfigService } from '@nestjs/config';
export declare class ReportCardPdfService {
    private configService;
    constructor(configService: ConfigService);
    generateReportCardHtml(data: ReportCardData): string;
    private getGradeStyle;
    private formatExamType;
}
export interface ReportCardData {
    student: {
        name: string;
        roll_number: string;
        admission_number: string;
        class_name: string;
        section_name: string;
    };
    exam: {
        name: string;
        exam_type: string;
        session_name: string;
    };
    subjects: {
        subject_name: string;
        max_marks: number;
        marks_obtained: number | null;
        grade: string;
        passed: boolean;
    }[];
    summary: {
        total_marks_obtained: number;
        total_max_marks: number;
        percentage: number;
        overall_grade: string;
        result: string;
        rank: number;
        class_average: number;
    };
    school: {
        name: string;
        logo_url?: string;
        address?: string;
        primary_color?: string;
        board_affiliation?: string;
    };
}
