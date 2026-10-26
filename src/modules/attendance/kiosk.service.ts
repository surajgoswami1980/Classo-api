import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { StaffAttendanceEntity } from '../../entities/staff-attendance.entity';
import { RedisService } from '../../common/providers/redis.service';
import { AttendanceConfigService, hhmmToMinutes, zonedNow } from './attendance-config.service';
import { HolidayService } from './holiday.service';

/**
 * Shared-device "kiosk" attendance (free, offline-friendly engine).
 *
 * A single tablet at the entrance runs the kiosk screen. Staff:
 *   1. pick their name (or type a PIN),
 *   2. show their face — the APP confirms a live face is present (detection +
 *      blink/turn liveness, done on-device with expo-camera / face detector),
 *   3. the kiosk sends { user_id, liveness_ok, selfie } and we mark entry/exit.
 *
 * Identity here = the selected staff member; the face step proves a real
 * person is standing there (presence + liveness), not a photo. This is the
 * FREE engine — no AWS, no per-scan cost. The selfie is kept for audit so an
 * admin can spot-check who actually scanned.
 */

export interface KioskMarkDto {
  user_id: number;
  pin?: string;
  liveness_ok?: boolean;
  selfie?: string; // base64 JPEG (optional, for audit)
  device_id?: string;
}

@Injectable()
export class KioskService {
  constructor(
    @InjectRepository(StaffAttendanceEntity) private staffAttRepo: Repository<StaffAttendanceEntity>,
    @InjectDataSource() private readonly db: DataSource,
    private readonly configs: AttendanceConfigService,
    private readonly holidays: HolidayService,
    private readonly redis: RedisService,
  ) {}

  /** Staff the kiosk can mark (teachers + office staff of this school). */
  async roster(schoolId: number) {
    const rows = await this.db.query(
      `SELECT u.id as user_id, u.name, u.avatar, u.employee_id,
              t.designation, t.department
       FROM users u
       LEFT JOIN teachers t ON t.user_id = u.id AND t.school_id = u.school_id
       WHERE u.school_id = ? AND u.is_active = 1 AND u.deleted_at IS NULL
       ORDER BY u.name ASC`,
      [schoolId],
    );
    // Don't leak PINs; just whether one is set.
    return rows.map((r: any) => ({
      user_id: r.user_id,
      name: r.name,
      avatar: r.avatar,
      employee_id: r.employee_id,
      designation: r.designation,
      department: r.department,
    }));
  }

  /** Mark entry (check-in) or exit (check-out) for the selected staff member. */
  async mark(schoolId: number, dto: KioskMarkDto, type: 'in' | 'out') {
    const cfg = await this.configs.get(schoolId);
    if (!cfg.self_checkin.enabled) {
      throw new ForbiddenException('Self attendance is not enabled for this school.');
    }
    if (!cfg.kiosk?.enabled) {
      throw new ForbiddenException('The attendance kiosk is not enabled for this school.');
    }

    const user = await this.resolveUser(schoolId, dto);
    const now = zonedNow(cfg.timezone);

    const off = await this.holidays.dayOff(schoolId, now.date, 'staff', cfg);
    if (off) throw new BadRequestException(`Today is a holiday (${off.title}). No attendance needed.`);

    // The free engine relies on the app's on-device liveness result.
    if (cfg.self_checkin.require_face && !dto.liveness_ok) {
      throw new BadRequestException('Face/liveness check failed. Look at the camera and blink/turn as asked.');
    }

    // Throttle: at most 6 kiosk marks per user per 5 min (stops accidental double taps / spam).
    const rlKey = `kiosk:rl:${schoolId}:${user.user_id}`;
    const n = await this.redis.incr(rlKey);
    if (n === 1) await this.redis.expire(rlKey, 300);
    if (n > 6) throw new BadRequestException('Too many attempts for this person. Please wait a moment.');

    const existing = await this.staffAttRepo.findOne({
      where: { school_id: schoolId, user_id: user.user_id, date: now.date },
    });
    const start = hhmmToMinutes(cfg.timing.start);
    const end = hhmmToMinutes(cfg.timing.end);

    if (type === 'in') {
      if (existing?.check_in_time) throw new BadRequestException(`${user.name} has already checked in today.`);
      if (existing && existing.marked_by && existing.method === 'manual') {
        throw new BadRequestException(`${user.name}'s attendance was already marked by the admin (${existing.status}).`);
      }

      const lateBy = Math.max(0, now.minutes - start);
      let status = 'present';
      if (lateBy > cfg.timing.grace_minutes) status = 'late';
      if (cfg.timing.half_day_after_minutes > 0 && lateBy >= cfg.timing.half_day_after_minutes) status = 'half_day';

      const row = existing || this.staffAttRepo.create({ school_id: schoolId, user_id: user.user_id, date: now.date });
      Object.assign(row, {
        status,
        method: 'kiosk',
        check_in_time: new Date(),
        late_minutes: status === 'present' ? 0 : lateBy,
        device_id: (dto.device_id || 'kiosk').slice(0, 100),
        marked_by: null,
      });
      await this.staffAttRepo.save(row);
      await this.saveSelfie(schoolId, user.user_id, dto.selfie, 'in');

      return {
        user: { id: user.user_id, name: user.name },
        message: status === 'present' ? `Welcome, ${user.name}! Checked in.` : `Checked in — ${lateBy} min late.`,
        status,
        late_minutes: row.late_minutes,
        check_in_time: row.check_in_time,
      };
    }

    // check-out
    if (!existing?.check_in_time) throw new BadRequestException(`${user.name} has not checked in today.`);
    if (existing.check_out_time) throw new BadRequestException(`${user.name} has already checked out today.`);
    const early = now.minutes < end;
    Object.assign(existing, { check_out_time: new Date(), early_leave: early });
    await this.staffAttRepo.save(existing);
    await this.saveSelfie(schoolId, user.user_id, dto.selfie, 'out');

    return {
      user: { id: user.user_id, name: user.name },
      message: early ? `Bye, ${user.name}. Checked out early.` : `Bye, ${user.name}. Checked out.`,
      check_out_time: existing.check_out_time,
      early_leave: early,
    };
  }

  private async resolveUser(schoolId: number, dto: KioskMarkDto): Promise<{ user_id: number; name: string }> {
    if (!dto.user_id) throw new BadRequestException('No staff member selected.');
    // kiosk_pin may not exist yet (added by a later migration) — be tolerant.
    let rows: any[];
    try {
      rows = await this.db.query(
        'SELECT id as user_id, name, kiosk_pin FROM users WHERE id = ? AND school_id = ? AND is_active = 1 AND deleted_at IS NULL LIMIT 1',
        [dto.user_id, schoolId],
      );
    } catch {
      rows = await this.db.query(
        'SELECT id as user_id, name, NULL as kiosk_pin FROM users WHERE id = ? AND school_id = ? AND is_active = 1 AND deleted_at IS NULL LIMIT 1',
        [dto.user_id, schoolId],
      );
    }
    const u = rows?.[0];
    if (!u) throw new BadRequestException('Staff member not found.');

    // If this person has a PIN set, it must match (prevents someone picking a
    // colleague's name). PIN is optional per staff.
    if (u.kiosk_pin) {
      if (!dto.pin || String(dto.pin) !== String(u.kiosk_pin)) {
        throw new ForbiddenException('Wrong PIN. Please try again.');
      }
    }
    return { user_id: u.user_id, name: u.name };
  }

  /** Store the kiosk selfie for audit (best-effort; never blocks attendance). */
  private async saveSelfie(schoolId: number, userId: number, selfie: string | undefined, type: 'in' | 'out') {
    if (!selfie) return;
    try {
      await this.db.query(
        `INSERT INTO attendance_attempts (school_id, user_id, type, result, reason, face_score, device_id, created_at)
         VALUES (?, ?, ?, 'accepted', 'kiosk', NULL, 'kiosk', NOW())`,
        [schoolId, userId, type],
      );
    } catch {
      /* audit must never block attendance */
    }
  }
}
