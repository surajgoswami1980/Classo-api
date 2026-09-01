import { Repository } from 'typeorm';
import { SchoolEntity } from '../../entities/school.entity';
import { AcademicSessionEntity } from '../../entities/academic-session.entity';
import { UpdateSettingsDto, UpdateAcademicYearDto } from './dto/settings.dto';
export declare class SettingsService {
    private schoolRepo;
    private sessionRepo;
    constructor(schoolRepo: Repository<SchoolEntity>, sessionRepo: Repository<AcademicSessionEntity>);
    getSettings(schoolId: number): Promise<{
        grading_scale: string;
        attendance_threshold_percent: number;
        fee_late_penalty_per_day: number;
        library_fine_per_day: number;
        working_days: string[];
    }>;
    updateSettings(schoolId: number, dto: UpdateSettingsDto): Promise<Record<string, any>>;
    getAcademicYear(schoolId: number): Promise<{
        current: AcademicSessionEntity;
        all: AcademicSessionEntity[];
    }>;
    updateAcademicYear(schoolId: number, dto: UpdateAcademicYearDto): Promise<AcademicSessionEntity>;
}
