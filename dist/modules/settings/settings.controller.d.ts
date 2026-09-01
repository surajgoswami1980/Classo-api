import { SettingsService } from './settings.service';
import { UpdateSettingsDto, UpdateAcademicYearDto } from './dto/settings.dto';
export declare class SettingsController {
    private readonly settingsService;
    constructor(settingsService: SettingsService);
    getSettings(schoolId: number): Promise<{
        success: boolean;
        data: {
            grading_scale: string;
            attendance_threshold_percent: number;
            fee_late_penalty_per_day: number;
            library_fine_per_day: number;
            working_days: string[];
        };
    }>;
    updateSettings(dto: UpdateSettingsDto, schoolId: number): Promise<{
        success: boolean;
        data: Record<string, any>;
    }>;
    getAcademicYear(schoolId: number): Promise<{
        success: boolean;
        data: {
            current: import("../../entities/academic-session.entity").AcademicSessionEntity;
            all: import("../../entities/academic-session.entity").AcademicSessionEntity[];
        };
    }>;
    updateAcademicYear(dto: UpdateAcademicYearDto, schoolId: number): Promise<{
        success: boolean;
        data: import("../../entities/academic-session.entity").AcademicSessionEntity;
    }>;
}
