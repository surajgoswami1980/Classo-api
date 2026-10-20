import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { StaffAttendanceEntity } from '../../entities/staff-attendance.entity';
import { RedisService } from '../../common/providers/redis.service';
import {
  AttendanceConfig, AttendanceConfigService, haversineMeters, hhmmToMinutes, zonedNow,
} from './attendance-config.service';
import { HolidayService } from './holiday.service';
import { FaceMatchService } from './face-match.service';

export interface CheckDto {
  lat?: number;
  lng?: number;
  accuracy?: number;
  mocked?: boolean;
  device_id?: string;
  device_name?: string;
  platform?: string;
  /** Liveness challenge id issued by /attendance/self/challenge */
  challenge_id?: string;
  face_straight?: string; // base64 JPEG
  face_turned?: string; // base64 JPEG
}

/** Roles allowed to self check-in (teachers + office staff + admins). */
export const SELF_ATTENDANCE_ROLES = ['teacher', 'incharge', 'staff', 'sub_admin', 'school_admin'];

@Injectable()
export class SelfAttendanceService {
  constructor(
    @InjectRepository(StaffAttendanceEntity) private staffAttRepo: Repository<StaffAttendanceEntity>,
    @InjectDataSource() private readonly db: DataSource,
    private readonly configs: AttendanceConfigService,
    private readonly holidays: HolidayService,
    private readonly face: FaceMatchService,
    private readonly redis: RedisService,
  ) {}

  // ─── Status for the app screen ────────────────────────────────

  async status(schoolId: number, userId: number) {
    const cfg = await this.configs.get(schoolId);
    const now = zonedNow(cfg.timezone);
    const record = await this.staffAttRepo.findOne({ where: { school_id: schoolId, user_id: userId, date: now.date } });
    const dayOff = await this.holidays.dayOff(schoolId, now.date, 'staff', cfg);
    const faceProfile = await this.faceProfile(userId);
    const device = await this.boundDevice(userId);
    const start = hhmmToMinutes(cfg.timing.start);
    const opensAt = Math.max(0, start - cfg.timing.checkin_opens_minutes);

    return {
      enabled: cfg.self_checkin.enabled,
      date: now.date,
      server_minutes: now.minutes,
      day_off: dayOff,
      rules: {
        require_location: cfg.self_checkin.require_location,
        require_face: cfg.self_checkin.require_face,
        require_checkout: cfg.self_checkin.require_checkout,
        bind_device: cfg.self_checkin.bind_device,
        radius_m: cfg.location.radius_m,
        max_accuracy_m: cfg.location.max_accuracy_m,
        location_set: cfg.location.lat !== null && cfg.location.lng !== null,
        school_lat: cfg.location.lat,
        school_lng: cfg.location.lng,
      },
      timing: {
        start: cfg.timing.start,
        end: cfg.timing.end,
        grace_minutes: cfg.timing.grace_minutes,
        checkin_opens_at: minutesToHHMM(opensAt),
        late_after: minutesToHHMM(start + cfg.timing.grace_minutes),
      },
      face: { status: faceProfile?.status || 'none', reject_reason: faceProfile?.reject_reason || null },
      device: device ? { device_name: device.device_name, platform: device.platform } : null,
      today: record
        ? {
            status: record.status,
            method: record.method,
            check_in_time: record.check_in_time,
            check_out_time: record.check_out_time,
            late_minutes: record.late_minutes,
          }
        : null,
    };
  }

  // ─── Liveness challenge ───────────────────────────────────────

  async challenge(schoolId: number, userId: number) {
    const id = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
    const direction = Math.random() < 0.5 ? 'left' : 'right';
    await this.redis.setJson(`att:challenge:${id}`, { schoolId, userId, direction }, 120);
    return { challenge_id: id, direction, expires_in: 120 };
  }

  private async consumeChallenge(id: string | undefined, schoolId: number, userId: number) {
    if (!id) return false;
    const key = `att:challenge:${id}`;
    const c = await this.redis.getJson<{ schoolId: number; userId: number }>(key);
    if (!c) return false;
    await this.redis.del(key); // single use
    return c.schoolId === schoolId && c.userId === userId;
  }

  // ─── Check-in / check-out ─────────────────────────────────────

  async checkIn(schoolId: number, userId: number, dto: CheckDto) {
    return this.mark(schoolId, userId, dto, 'in');
  }

  async checkOut(schoolId: number, userId: number, dto: CheckDto) {
    return this.mark(schoolId, userId, dto, 'out');
  }

  private async mark(schoolId: number, userId: number, dto: CheckDto, type: 'in' | 'out') {
    // Throttle brute-force / spam: 10 attempts per 10 minutes per user.
    const rlKey = `att:rl:${userId}`;
    const n = await this.redis.incr(rlKey);
    if (n === 1) await this.redis.expire(rlKey, 600);
    if (n > 10) throw new BadRequestException('Too many attempts. Please wait a few minutes.');

    const cfg = await this.configs.get(schoolId);
    const now = zonedNow(cfg.timezone);
    const ctx: AttemptCtx = { schoolId, userId, type, dto };

    try {
      if (!cfg.self_checkin.enabled) throw new ForbiddenException('Self attendance is not enabled for your school.');

      const off = await this.holidays.dayOff(schoolId, now.date, 'staff', cfg);
      if (off) throw new BadRequestException(`Today is a holiday (${off.title}). No attendance needed.`);

      await this.checkDevice(cfg, userId, schoolId, dto);
      const geo = this.checkLocation(cfg, dto);
      ctx.distance = geo.distance;
      const faceScore = cfg.self_checkin.require_face ? await this.checkFace(cfg, schoolId, userId, dto) : null;
      ctx.faceScore = faceScore;

      const method = cfg.self_checkin.require_face
        ? cfg.self_checkin.require_location ? 'face_geo' : 'face'
        : cfg.self_checkin.require_location ? 'geo' : 'app';

      const existing = await this.staffAttRepo.findOne({ where: { school_id: schoolId, user_id: userId, date: now.date } });
      const start = hhmmToMinutes(cfg.timing.start);
      const end = hhmmToMinutes(cfg.timing.end);

      if (type === 'in') {
        if (existing?.check_in_time) throw new BadRequestException('You have already checked in today.');
        if (existing && existing.marked_by && existing.method === 'manual') {
          throw new BadRequestException(`Your attendance for today was already marked by the admin (${existing.status}).`);
        }
        if (now.minutes < start - cfg.timing.checkin_opens_minutes) {
          throw new BadRequestException(`Check-in opens at ${minutesToHHMM(start - cfg.timing.checkin_opens_minutes)}.`);
        }
        if (now.minutes > end) throw new BadRequestException(`Check-in closed at ${cfg.timing.end}. Contact the admin.`);

        const lateBy = Math.max(0, now.minutes - start);
        let status = 'present';
        if (lateBy > cfg.timing.grace_minutes) status = 'late';
        if (cfg.timing.half_day_after_minutes > 0 && lateBy >= cfg.timing.half_day_after_minutes) status = 'half_day';

        const row = existing || this.staffAttRepo.create({ school_id: schoolId, user_id: userId, date: now.date });
        Object.assign(row, {
          status,
          method,
          check_in_time: new Date(),
          late_minutes: status === 'present' ? 0 : lateBy,
          check_in_lat: geo.lat,
          check_in_lng: geo.lng,
          check_in_accuracy: geo.accuracy,
          check_in_distance: geo.distance,
          face_score: faceScore,
          device_id: dto.device_id?.slice(0, 100) || null,
          marked_by: null,
        });
        await this.staffAttRepo.save(row);
        await this.logAttempt(ctx, 'accepted');
        return {
          message: status === 'present' ? 'Checked in. Have a great day!' : `Checked in — ${lateBy} min late.`,
          status,
          late_minutes: row.late_minutes,
          check_in_time: row.check_in_time,
          distance_m: geo.distance,
        };
      }

      // check-out
      if (!existing?.check_in_time) throw new BadRequestException('You have not checked in today.');
      if (existing.check_out_time) throw new BadRequestException('You have already checked out today.');
      const early = now.minutes < end;
      Object.assign(existing, {
        check_out_time: new Date(),
        check_out_lat: geo.lat,
        check_out_lng: geo.lng,
        check_out_distance: geo.distance,
        early_leave: early,
      });
      await this.staffAttRepo.save(existing);
      await this.logAttempt(ctx, 'accepted');
      return { message: early ? `Checked out early (school ends ${cfg.timing.end}).` : 'Checked out. See you tomorrow!', check_out_time: existing.check_out_time, early_leave: early };
    } catch (e: any) {
      await this.logAttempt(ctx, 'rejected', e?.message);
      throw e;
    }
  }

  // ─── Checks ───────────────────────────────────────────────────

  private checkLocation(cfg: AttendanceConfig, dto: CheckDto) {
    const empty = { lat: null, lng: null, accuracy: null, distance: null };
    if (!cfg.self_checkin.require_location) {
      return dto.lat != null && dto.lng != null ? { ...empty, lat: dto.lat, lng: dto.lng } : empty;
    }
    if (cfg.location.lat === null || cfg.location.lng === null) {
      throw new BadRequestException('School location is not set yet. Ask the admin.');
    }
    const lat = Number(dto.lat);
    const lng = Number(dto.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
      throw new BadRequestException('Location is required. Turn on GPS and allow location access.');
    }
    if (dto.mocked) throw new ForbiddenException('Mock location detected. Turn off fake GPS apps.');
    const accuracy = Math.round(Number(dto.accuracy) || 9999);
    if (accuracy > cfg.location.max_accuracy_m) {
      throw new BadRequestException(`GPS signal is weak (±${accuracy} m). Move to an open area and try again.`);
    }
    const distance = Math.round(haversineMeters(lat, lng, Number(cfg.location.lat), Number(cfg.location.lng)));
    if (distance > cfg.location.radius_m) {
      throw new ForbiddenException(`You are ${distance} m from school. Be within ${cfg.location.radius_m} m to mark attendance.`);
    }
    return { lat, lng, accuracy, distance };
  }

  private async checkDevice(cfg: AttendanceConfig, userId: number, schoolId: number, dto: CheckDto) {
    if (!cfg.self_checkin.bind_device) return;
    const deviceId = (dto.device_id || '').trim().slice(0, 100);
    if (!deviceId) throw new BadRequestException('Device could not be identified. Update the app.');
    const bound = await this.boundDevice(userId);
    if (!bound) {
      // First use binds this phone.
      await this.db.query(
        `INSERT INTO staff_devices (school_id, user_id, device_id, device_name, platform, last_used_at, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW(), NOW())`,
        [schoolId, userId, deviceId, (dto.device_name || '').slice(0, 150) || null, (dto.platform || '').slice(0, 20) || null],
      );
      return;
    }
    if (bound.device_id !== deviceId) {
      throw new ForbiddenException('Attendance is linked to another phone. Ask the admin to reset your device.');
    }
    await this.db.query('UPDATE staff_devices SET last_used_at = NOW() WHERE user_id = ?', [userId]);
  }

  private async checkFace(cfg: AttendanceConfig, schoolId: number, userId: number, dto: CheckDto): Promise<number> {
    if (!(await this.consumeChallenge(dto.challenge_id, schoolId, userId))) {
      throw new BadRequestException('Liveness check expired. Please try again.');
    }
    const profile = await this.faceProfile(userId);
    if (!profile || profile.status !== 'approved') {
      throw new ForbiddenException(
        profile?.status === 'pending' ? 'Your face photo is waiting for admin approval.' : 'Register your face first.',
      );
    }
    const ref = FaceMatchService.decode(profile.image);
    const straight = FaceMatchService.decode(dto.face_straight || '');
    const turned = FaceMatchService.decode(dto.face_turned || '');
    if (!ref) throw new BadRequestException('Registered face photo is invalid. Register again.');
    if (!straight || !turned) throw new BadRequestException('Face photos are missing or invalid.');
    const res = await this.face.verify(ref, straight, turned, cfg.face.threshold);
    if (!res.ok) throw new ForbiddenException(res.reason || 'Face verification failed.');
    return res.score as number;
  }

  // ─── Face registration ────────────────────────────────────────

  async registerFace(schoolId: number, userId: number, image: string, consent: boolean) {
    if (!consent) throw new BadRequestException('Please accept the consent to use your face for attendance.');
    const buf = FaceMatchService.decode(image);
    if (!buf) throw new BadRequestException('Invalid photo. Use a clear, well-lit selfie.');
    if (await this.face.isConfigured()) {
      const single = await this.face.singleFace(buf);
      if (!single.ok) throw new BadRequestException(single.reason);
    }
    const existing = await this.faceProfile(userId);
    if (existing?.status === 'approved') throw new BadRequestException('Your face is already registered. Ask the admin to reset it.');
    const b64 = buf.toString('base64');
    await this.db.query(
      `INSERT INTO staff_face_profiles (school_id, user_id, image, status, consent_at, created_at, updated_at)
       VALUES (?, ?, ?, 'pending', NOW(), NOW(), NOW())
       ON DUPLICATE KEY UPDATE image = VALUES(image), status = 'pending', consent_at = NOW(),
         reviewed_by = NULL, reviewed_at = NULL, reject_reason = NULL, updated_at = NOW()`,
      [schoolId, userId, b64],
    );
    return { message: 'Face photo submitted. The admin will approve it shortly.', status: 'pending' };
  }

  // ─── Helpers ──────────────────────────────────────────────────

  private async faceProfile(userId: number) {
    const rows = await this.db.query(
      'SELECT status, image, reject_reason FROM staff_face_profiles WHERE user_id = ? LIMIT 1',
      [userId],
    );
    return rows?.[0] || null;
  }

  private async boundDevice(userId: number) {
    const rows = await this.db.query('SELECT device_id, device_name, platform FROM staff_devices WHERE user_id = ? LIMIT 1', [userId]);
    return rows?.[0] || null;
  }

  private async logAttempt(ctx: AttemptCtx, result: 'accepted' | 'rejected', reason?: string) {
    try {
      await this.db.query(
        `INSERT INTO attendance_attempts (school_id, user_id, type, result, reason, lat, lng, accuracy, distance, face_score, device_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          ctx.schoolId, ctx.userId, ctx.type, result, reason?.slice(0, 255) || null,
          Number.isFinite(Number(ctx.dto.lat)) ? ctx.dto.lat : null,
          Number.isFinite(Number(ctx.dto.lng)) ? ctx.dto.lng : null,
          Number.isFinite(Number(ctx.dto.accuracy)) ? Math.min(65535, Math.round(Number(ctx.dto.accuracy))) : null,
          ctx.distance ?? null, ctx.faceScore ?? null, ctx.dto.device_id?.slice(0, 100) || null,
        ],
      );
    } catch {
      /* audit must never block attendance */
    }
  }
}

interface AttemptCtx {
  schoolId: number;
  userId: number;
  type: 'in' | 'out';
  dto: CheckDto;
  distance?: number | null;
  faceScore?: number | null;
}

export function minutesToHHMM(m: number) {
  const mm = ((m % 1440) + 1440) % 1440;
  return `${String(Math.floor(mm / 60)).padStart(2, '0')}:${String(mm % 60).padStart(2, '0')}`;
}
