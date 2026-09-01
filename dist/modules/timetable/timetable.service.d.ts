import { Repository } from 'typeorm';
import { TimetablePeriodEntity } from '../../entities/timetable-period.entity';
import { StudentEntity } from '../../entities/student.entity';
export declare class TimetableService {
    private timetableRepo;
    private studentRepo;
    constructor(timetableRepo: Repository<TimetablePeriodEntity>, studentRepo: Repository<StudentEntity>);
    getClassTimetable(schoolId: number, classId: number, sectionId: number): Promise<{
        id: any;
        day_of_week: any;
        period_number: any;
        start_time: any;
        end_time: any;
        subject_name: any;
        teacher_name: any;
        subject_id: any;
        teacher_id: any;
    }[]>;
    getStudentTodayTimetable(schoolId: number, userId: number): Promise<{
        period_number: any;
        subject_name: any;
        teacher_name: any;
        start_time: any;
        end_time: any;
    }[]>;
    getStudentWeekTimetable(schoolId: number, userId: number): Promise<{
        id: any;
        day_of_week: any;
        period_number: any;
        start_time: any;
        end_time: any;
        subject_name: any;
        teacher_name: any;
        subject_id: any;
        teacher_id: any;
    }[]>;
}
