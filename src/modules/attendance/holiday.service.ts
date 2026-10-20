import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HolidayEntity } from '../../entities/holiday.entity';
import { AttendanceConfig, AttendanceConfigService } from './attendance-config.service';

export type Audience = 'students' | 'staff';

export interface DayInfo {
  date: string;
  /** holiday = declared by admin; weekly_off = Sunday / alternate Saturday */
  kind: 'holiday' | 'weekly_off';
  title: string;
  type?: string;
}

/**
 * Holidays and weekly offs. Used to:
 *  - show them on student / staff calendars
 *  - block marking attendance on non-working days
 *  - exclude them from attendance percentages
 */
@Injectable()
export class HolidayService {
  constructor(
    @InjectRepository(HolidayEntity) private holidayRepo: Repository<HolidayEntity>,
    private readonly config: AttendanceConfigService,
  ) {}

  private audienceFilter(audience: Audience) {
    return audience === 'students' ? ['all', 'students'] : ['all', 'staff'];
  }

  async listInRange(schoolId: number, from: string, to: string, audience?: Audience) {
    const q = this.holidayRepo
      .createQueryBuilder('h')
      .where('h.school_id = :schoolId', { schoolId })
      .andWhere('h.start_date <= :to AND h.end_date >= :from', { from, to })
      .orderBy('h.start_date', 'ASC');
    if (audience) q.andWhere('h.applies_to IN (:...aud)', { aud: this.audienceFilter(audience) });
    return q.getMany();
  }

  async upcoming(schoolId: number, today: string, audience: Audience, limit = 10) {
    return this.holidayRepo
      .createQueryBuilder('h')
      .where('h.school_id = :schoolId', { schoolId })
      .andWhere('h.end_date >= :today', { today })
      .andWhere('h.applies_to IN (:...aud)', { aud: this.audienceFilter(audience) })
      .orderBy('h.start_date', 'ASC')
      .limit(limit)
      .getMany();
  }

  /**
   * Every non-working day between from and to (inclusive), keyed by date.
   * Declared holidays win over weekly offs.
   */
  async nonWorkingDays(schoolId: number, from: string, to: string, audience: Audience, cfg?: AttendanceConfig) {
    const conf = cfg || (await this.config.get(schoolId));
    const map = new Map<string, DayInfo>();

    for (const d of eachDate(from, to)) {
      if (this.config.isWeeklyOff(conf, d)) map.set(d, { date: d, kind: 'weekly_off', title: 'Weekly off' });
    }
    const holidays = await this.listInRange(schoolId, from, to, audience);
    for (const h of holidays) {
      const start = toDateStr(h.start_date) < from ? from : toDateStr(h.start_date);
      const end = toDateStr(h.end_date) > to ? to : toDateStr(h.end_date);
      for (const d of eachDate(start, end)) {
        map.set(d, { date: d, kind: 'holiday', title: h.title, type: h.type });
      }
    }
    return map;
  }

  /** Is a single date a non-working day? Returns the reason, or null if it's a working day. */
  async dayOff(schoolId: number, date: string, audience: Audience, cfg?: AttendanceConfig): Promise<DayInfo | null> {
    const map = await this.nonWorkingDays(schoolId, date, date, audience, cfg);
    return map.get(date) || null;
  }

  /** Working days in a range that are on or before `upTo` (so future days aren't counted). */
  async workingDayCount(schoolId: number, from: string, to: string, audience: Audience, upTo: string) {
    const end = to < upTo ? to : upTo;
    if (end < from) return 0;
    const off = await this.nonWorkingDays(schoolId, from, end, audience);
    let n = 0;
    for (const d of eachDate(from, end)) if (!off.has(d)) n++;
    return n;
  }
}

/** TypeORM returns DATE columns as 'YYYY-MM-DD' strings (mysql2 dateStrings) or Date objects — normalise. */
export function toDateStr(v: string | Date): string {
  if (v instanceof Date) {
    return `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}`;
  }
  return String(v).slice(0, 10);
}

/** Iterate YYYY-MM-DD dates inclusively, timezone-safe (UTC arithmetic). */
export function* eachDate(from: string, to: string): Generator<string> {
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  const cur = new Date(Date.UTC(fy, fm - 1, fd));
  const end = Date.UTC(ty, tm - 1, td);
  let guard = 0;
  while (cur.getTime() <= end && guard++ < 1000) {
    yield cur.toISOString().slice(0, 10);
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
}
