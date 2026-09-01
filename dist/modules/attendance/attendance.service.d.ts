import { Repository } from 'typeorm';
import { StudentAttendanceEntity } from '../../entities/student-attendance.entity';
import { StaffAttendanceEntity } from '../../entities/staff-attendance.entity';
import { StudentEntity } from '../../entities/student.entity';
import { MarkStudentAttendanceDto, MarkStaffAttendanceDto, AttendanceReportDto } from './dto/attendance.dto';
export declare class AttendanceService {
    private studentAttRepo;
    private staffAttRepo;
    private studentRepo;
    constructor(studentAttRepo: Repository<StudentAttendanceEntity>, staffAttRepo: Repository<StaffAttendanceEntity>, studentRepo: Repository<StudentEntity>);
    markStudentAttendance(schoolId: number, dto: MarkStudentAttendanceDto, markedBy: number): Promise<{
        message: string;
        date: string;
        class_id: number;
        section_id: number;
        total_present: number;
        total_absent: number;
        total_late: number;
    }>;
    getStudentAttendance(schoolId: number, classId: number, sectionId: number, date: string): Promise<{
        date: string;
        class_id: number;
        section_id: number;
        is_marked: boolean;
        students: {
            student_id: number;
            roll_number: string;
            name: string;
            status: string;
            remarks: string;
        }[];
    }>;
    getStudentMonthlyAttendance(schoolId: number, userId: number, month: number, year: number, studentId?: number): Promise<{
        records: any[];
        summary: {
            total_days: number;
            present: number;
            absent: number;
            late: number;
            half_day: number;
        };
        month?: undefined;
        year?: undefined;
        student_id?: undefined;
    } | {
        month: number;
        year: number;
        student_id: number;
        records: {
            date: string;
            status: string;
            remarks: string;
        }[];
        summary: {
            total_days: number;
            present: number;
            absent: number;
            late: number;
            half_day: number;
        };
    }>;
    markStaffAttendance(schoolId: number, dto: MarkStaffAttendanceDto, markedBy: number): Promise<{
        message: string;
        date: string;
    }>;
    getAttendanceReport(schoolId: number, dto: AttendanceReportDto): Promise<{
        from_date: string;
        to_date: string;
        total_students: number;
        report: {
            percentage: number;
            present: number;
            absent: number;
            late: number;
            half_day: number;
            total: number;
            student_id: number;
        }[];
    }>;
    getStaffAttendanceReport(schoolId: number, fromDate: string, toDate: string): Promise<{
        present: number;
        absent: number;
        leave: number;
        late: number;
        total: number;
        user_id: number;
    }[]>;
}
