import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Per-school attendance rules, stored in schools.settings.attendance (JSON)
 * and edited from Admin → Attendance → Settings.
 *
 * All times are school-local wall-clock "HH:mm" in the school's timezone.
 */
export interface AttendanceConfig {
  timezone: string;
  /** Weekdays the school is closed: 0 = Sunday … 6 = Saturday. */
  weekly_off: number[];
  /** Saturdays of the month that are off (e.g. [2, 4] = 2nd and 4th Saturday). */
  saturday_off_weeks: number[];
  self_checkin: {
    enabled: boolean;
    require_location: boolean;
    require_face: boolean;
    require_checkout: boolean;
    bind_device: boolean;
  };
  location: {
    lat: number | null;
    lng: number | null;
    radius_m: number;
    max_accuracy_m: number;
  };
  timing: {
    start: string; // school starts, e.g. "09:00"
    end: string; // school ends, e.g. "14:00"
    grace_minutes: number; // late after start + grace
    checkin_opens_minutes: number; // check-in allowed this many minutes before start
    half_day_after_minutes: number; // arriving this late (after start) = half day; 0 = off
  };
  face: { threshold: number };
  biometric: { enabled: boolean };
}

export const DEFAULT_ATTENDANCE_CONFIG: AttendanceConfig = {
  timezone: 'Asia/Kolkata',
  weekly_off: [0],
  saturday_off_weeks: [],
  self_checkin: { enabled: false, require_location: true, require_face: false, require_checkout: false, bind_device: true },
  location: { lat: null, lng: null, radius_m: 150, max_accuracy_m: 100 },
  timing: { start: '09:00', end: '14:00', grace_minutes: 10, checkin_opens_minutes: 60, half_day_after_minutes: 0 },
  face: { threshold: 90 },
  biometric: { enabled: false },
};

/** Current wall-clock in a timezone, as numbers + a YYYY-MM-DD string. */
export function zonedNow(tz: string, at: Date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const y = get('year');
  const m = get('month');
  const d = get('day');
  return {
    date: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    minutes: get('hour') * 60 + get('minute'),
    weekday: new Date(Date.UTC(y, m - 1, d)).getUTCDay(),
  };
}

export const hhmmToMinutes = (s: string) => {
  const [h, m] = String(s || '0:0').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

/** Great-circle distance in metres. */
export function haversineMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (x: number) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

@Injectable()
export class AttendanceConfigService {
  private cache = new Map<number, { cfg: AttendanceConfig; at: number }>();

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async get(schoolId: number): Promise<AttendanceConfig> {
    const hit = this.cache.get(schoolId);
    if (hit && Date.now() - hit.at < 30_000) return hit.cfg;

    const rows = await this.dataSource.query('SELECT settings FROM schools WHERE id = ? LIMIT 1', [schoolId]);
    let settings: any = rows?.[0]?.settings ?? {};
    if (typeof settings === 'string') {
      try { settings = JSON.parse(settings); } catch { settings = {}; }
    }
    const saved = settings?.attendance || {};
    const legacyWorking: string[] | undefined = settings?.working_days;

    const cfg = this.merge(saved, legacyWorking);
    this.cache.set(schoolId, { cfg, at: Date.now() });
    return cfg;
  }

  invalidate(schoolId: number) {
    this.cache.delete(schoolId);
  }

  private merge(saved: any, legacyWorking?: string[]): AttendanceConfig {
    const d = DEFAULT_ATTENDANCE_CONFIG;
    const names = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    let weeklyOff = Array.isArray(saved.weekly_off) ? saved.weekly_off.map(Number) : null;
    if (!weeklyOff && Array.isArray(legacyWorking) && legacyWorking.length) {
      weeklyOff = names.map((n, i) => (legacyWorking.includes(n) ? -1 : i)).filter((i) => i >= 0);
    }
    return {
      timezone: saved.timezone || d.timezone,
      weekly_off: weeklyOff ?? d.weekly_off,
      saturday_off_weeks: Array.isArray(saved.saturday_off_weeks) ? saved.saturday_off_weeks.map(Number) : d.saturday_off_weeks,
      self_checkin: { ...d.self_checkin, ...(saved.self_checkin || {}) },
      location: { ...d.location, ...(saved.location || {}) },
      timing: { ...d.timing, ...(saved.timing || {}) },
      face: { ...d.face, ...(saved.face || {}) },
      biometric: { ...d.biometric, ...(saved.biometric || {}) },
    };
  }

  /** Is this date a weekly off day (Sunday, 2nd/4th Saturday…)? */
  isWeeklyOff(cfg: AttendanceConfig, dateStr: string): boolean {
    const [y, m, d] = dateStr.split('-').map(Number);
    const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    if (cfg.weekly_off.includes(weekday)) return true;
    if (weekday === 6 && cfg.saturday_off_weeks.length) {
      const nth = Math.ceil(d / 7);
      if (cfg.saturday_off_weeks.includes(nth)) return true;
    }
    return false;
  }
}
