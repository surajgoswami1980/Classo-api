export declare class StudentAttendanceItemDto {
    student_id: number;
    status: string;
    remarks?: string;
}
export declare class MarkStudentAttendanceDto {
    class_id: number;
    section_id: number;
    date: string;
    attendance: StudentAttendanceItemDto[];
}
export declare class StaffAttendanceItemDto {
    user_id: number;
    status: string;
    check_in_time?: string;
    check_out_time?: string;
    remarks?: string;
}
export declare class MarkStaffAttendanceDto {
    date: string;
    attendance: StaffAttendanceItemDto[];
}
export declare class GetAttendanceDto {
    class_id: number;
    section_id: number;
    date: string;
}
export declare class AttendanceReportDto {
    class_id?: number;
    section_id?: number;
    student_id?: number;
    from_date: string;
    to_date: string;
}
