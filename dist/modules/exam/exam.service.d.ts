import { Repository } from 'typeorm';
import { ExamEntity } from '../../entities/exam.entity';
import { StudentMarksEntity } from '../../entities/student-marks.entity';
import { StudentEntity } from '../../entities/student.entity';
import { SubjectEntity } from '../../entities/subject.entity';
import { RedisService } from '../../common/providers/redis.service';
export declare class ExamService {
    private examRepo;
    private marksRepo;
    private studentRepo;
    private subjectRepo;
    private redis;
    constructor(examRepo: Repository<ExamEntity>, marksRepo: Repository<StudentMarksEntity>, studentRepo: Repository<StudentEntity>, subjectRepo: Repository<SubjectEntity>, redis: RedisService);
    createExam(schoolId: number, dto: CreateExamDto): Promise<ExamEntity>;
    getExamSubjects(schoolId: number, examId: number, classId: number): Promise<any>;
    listExams(schoolId: number, sessionId?: number): Promise<ExamEntity[]>;
    getMarksEntryData(schoolId: number, examId: number, examSubjectId: number, classId: number, sectionId: number): Promise<{
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
    }>;
    enterMarks(schoolId: number, dto: EnterMarksDto, enteredBy: number): Promise<{
        message: string;
        exam_id: number;
        exam_subject_id: number;
    }>;
    getReportCard(schoolId: number, studentId: number, examId: number): Promise<unknown>;
    private calculateRank;
    private getClassAverage;
    private calculateGrade;
    publishExam(schoolId: number, examId: number): Promise<{
        message: string;
        exam_id: number;
    }>;
    getResultAnalysis(schoolId: number, examId: number, classId: number): Promise<any>;
}
export declare class CreateExamDto {
    academic_session_id: number;
    name: string;
    exam_type: string;
    start_date?: string;
    end_date?: string;
}
export declare class EnterMarksDto {
    exam_id: number;
    exam_subject_id: number;
    max_marks: number;
    marks: {
        student_id: number;
        marks_obtained: number;
        remarks?: string;
    }[];
}
