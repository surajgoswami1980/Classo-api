import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SchoolEntity } from '../../entities/school.entity';
import { AcademicSessionEntity } from '../../entities/academic-session.entity';
import { UpdateSettingsDto, UpdateAcademicYearDto } from './dto/settings.dto';

const DEFAULT_SETTINGS = {
  grading_scale: 'percentage',
  attendance_threshold_percent: 75,
  fee_late_penalty_per_day: 0,
  library_fine_per_day: 2,
  working_days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
};

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(SchoolEntity) private schoolRepo: Repository<SchoolEntity>,
    @InjectRepository(AcademicSessionEntity) private sessionRepo: Repository<AcademicSessionEntity>,
  ) {}

  async getSettings(schoolId: number) {
    const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('School not found');

    return { ...DEFAULT_SETTINGS, ...(school.settings || {}) };
  }

  async updateSettings(schoolId: number, dto: UpdateSettingsDto) {
    const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
    if (!school) throw new NotFoundException('School not found');

    school.settings = { ...DEFAULT_SETTINGS, ...(school.settings || {}), ...dto };
    await this.schoolRepo.save(school);

    return school.settings;
  }

  async getAcademicYear(schoolId: number) {
    const current = await this.sessionRepo.findOne({ where: { school_id: schoolId, is_current: 1 } });
    const all = await this.sessionRepo.find({ where: { school_id: schoolId }, order: { start_date: 'DESC' } });
    return { current, all };
  }

  /**
   * Create (or update, if `name` matches an existing session) an academic
   * year, optionally marking it as the current one.
   */
  async updateAcademicYear(schoolId: number, dto: UpdateAcademicYearDto) {
    let session = await this.sessionRepo.findOne({ where: { school_id: schoolId, name: dto.name } });

    if (session) {
      session.start_date = dto.start_date as any;
      session.end_date = dto.end_date as any;
    } else {
      session = this.sessionRepo.create({
        school_id: schoolId,
        name: dto.name,
        start_date: dto.start_date as any,
        end_date: dto.end_date as any,
        is_current: 0,
      });
    }

    if (dto.make_current) {
      await this.sessionRepo.update({ school_id: schoolId }, { is_current: 0 });
      session.is_current = 1;
    }

    return this.sessionRepo.save(session);
  }
}
