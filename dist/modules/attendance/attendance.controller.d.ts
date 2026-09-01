import { AttendanceService } from './attendance.service';
import { MarkStudentAttendanceDto, MarkStaffAttendanceDto, AttendanceReportDto } from './dto/attendance.dto';
export declare class AttendanceController {
    private readonly attendanceService;
    constructor(attendanceService: AttendanceService);
    markStudentAttendance(schoolId: number, userId: number, dto: MarkStudentAttendanceDto): Promise<{
        success: boolean;
        data: {
            message: string;
            date: string;
            class_id: number;
            section_id: number;
            total_present: number;
            total_absent: number;
            total_late: number;
        };
    }>;
    getStudentAttendance(schoolId: number, classId: number, sectionId: number, date: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    getStudentMonthlyAttendance(schoolId: number, userId: number, month: number, year: number, studentId?: number): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    getStudentReport(schoolId: number, dto: AttendanceReportDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    markStaffAttendance(schoolId: number, userId: number, dto: MarkStaffAttendanceDto): Promise<{
        success: boolean;
        data: {
            message: string;
            date: string;
        };
    }>;
    getStaffReport(schoolId: number, fromDate: string, toDate: string): Promise<{
        success: boolean;
        data: {
            present: number;
            absent: number;
            leave: number;
            late: number;
            total: number;
            user_id: number;
        }[];
    }>;
}
