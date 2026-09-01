import { TimetableService } from './timetable.service';
export declare class TimetableController {
    private readonly timetableService;
    constructor(timetableService: TimetableService);
    getClassTimetable(schoolId: number, classId: number, sectionId: number): Promise<{
        success: boolean;
        data: {
            id: any;
            day_of_week: any;
            period_number: any;
            start_time: any;
            end_time: any;
            subject_name: any;
            teacher_name: any;
            subject_id: any;
            teacher_id: any;
        }[];
    }>;
    getStudentTodayTimetable(schoolId: number, userId: number): Promise<{
        success: boolean;
        data: {
            period_number: any;
            subject_name: any;
            teacher_name: any;
            start_time: any;
            end_time: any;
        }[];
    }>;
    getStudentWeekTimetable(schoolId: number, userId: number): Promise<{
        success: boolean;
        data: {
            id: any;
            day_of_week: any;
            period_number: any;
            start_time: any;
            end_time: any;
            subject_name: any;
            teacher_name: any;
            subject_id: any;
            teacher_id: any;
        }[];
    }>;
}
