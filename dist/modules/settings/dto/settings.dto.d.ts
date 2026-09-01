export declare class UpdateSettingsDto {
    grading_scale?: 'percentage' | 'cgpa';
    attendance_threshold_percent?: number;
    fee_late_penalty_per_day?: number;
    library_fine_per_day?: number;
    working_days?: string[];
    [key: string]: any;
}
export declare class UpdateAcademicYearDto {
    name: string;
    start_date: string;
    end_date: string;
    make_current?: boolean;
}
