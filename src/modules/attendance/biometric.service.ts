import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AttendanceConfigService, hhmmToMinutes } from './attendance-config.service';
import { HolidayService } from './holiday.service';

/**
 * ZKTeco / eSSL "ADMS push" protocol (iClock). Most cheap Indian fingerprint
 * machines (ZKTeco K40/K50/MB20, eSSL X990/K21/MB160, Realtime T52 etc.) speak it.
 *
 * On the machine: Menu → Comm → Cloud Server (ADMS):
 *   Server address = your API host, Port = API port, HTTPS off/on as deployed.
 * The machine then calls:
 *   GET  /iclock/cdata?SN=XXXX&options=all     → handshake (we return config)
 *   POST /iclock/cdata?SN=XXXX&table=ATTLOG    → punches, one per line, tab-separated:
 *        PIN \t YYYY-MM-DD HH:mm:ss \t state \t verify \t workcode ...
 *   GET  /iclock/getrequest?SN=XXXX            → poll for commands (we reply "OK")
 *
 * Only machines registered in Admin → Attendance → Fingerprint devices are accepted.
 * First punch of the day = check-in, last punch = check-out.
 */
@Injectable()
export class BiometricService {
  private readonly logger = new Logger(BiometricService.name);

  constructor(
    @InjectDataSource() private readonly db: DataSource,
    private readonly configs: AttendanceConfigService,
    private readonly holidays: HolidayService,
  ) {}

  private async device(sn: string, ip?: string) {
    if (!sn || !/^[A-Za-z0-9_-]{4,60}$/.test(sn)) return null;
    const rows = await this.db.query('SELECT * FROM biometric_devices WHERE serial_number = ? AND is_active = 1 LIMIT 1', [sn]);
    const d = rows?.[0];
    if (d) await this.db.query('UPDATE biometric_devices SET last_seen_at = NOW(), last_ip = ? WHERE id = ?', [ip || null, d.id]);
    return d || null;
  }

  async handshake(sn: string, ip?: string): Promise<string> {
    const d = await this.device(sn, ip);
    if (!d) {
      this.logger.warn(`Unknown biometric device SN=${sn} from ${ip}`);
      return 'Device not registered';
    }
    return [
      `GET OPTION FROM: ${sn}`,
      `ATTLOGStamp=${d.attlog_stamp || 0}`,
      'OPERLOGStamp=9999',
      'ATTPHOTOStamp=None',
      'ErrorDelay=60',
      'Delay=30',
      'TransTimes=00:00;14:05',
      'TransInterval=1',
      'TransFlag=TransData AttLog',
      'TimeZone=330',
      'Realtime=1',
      'Encrypt=None',
    ].join('\n');
  }

  async receive(sn: string, table: string, body: string, ip?: string): Promise<string> {
    const d = await this.device(sn, ip);
    if (!d) return 'OK'; // never make an unknown device retry forever
    if (String(table).toUpperCase() !== 'ATTLOG') return 'OK';

    const lines = String(body || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 5000);
    let saved = 0;
    for (const line of lines) {
      const [pin, ts, state, verify] = line.split('\t');
      if (!pin || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(ts || '')) continue;
      try {
        await this.applyPunch(d, pin.trim(), ts, state, verify);
        saved++;
      } catch (e: any) {
        this.logger.error(`Punch failed SN=${sn} PIN=${pin} ${ts}: ${e.message}`);
      }
    }
    await this.db.query('UPDATE biometric_devices SET attlog_stamp = ? WHERE id = ?', [String(Date.now()), d.id]);
    return `OK: ${saved}`;
  }

  private async applyPunch(d: any, pin: string, ts: string, state?: string, verify?: string) {
    const schoolId = d.school_id;
    const map = (await this.db.query('SELECT user_id FROM biometric_user_maps WHERE school_id = ? AND device_pin = ? LIMIT 1', [schoolId, pin]))?.[0];
    const userId: number | null = map?.user_id ?? null;
    const date = ts.slice(0, 10);
    const minutes = Number(ts.slice(11, 13)) * 60 + Number(ts.slice(14, 16));

    const cfg = await this.configs.get(schoolId);
    let result = 'applied';
    if (!userId) result = 'unmapped';
    else if (!cfg.biometric.enabled) result = 'disabled';
    else if (await this.holidays.dayOff(schoolId, date, 'staff', cfg)) result = 'holiday';

    const ins = await this.db.query(
      `INSERT IGNORE INTO biometric_punches (school_id, device_id, serial_number, device_pin, user_id, punched_at, punch_state, verify_mode, result, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [schoolId, d.id, d.serial_number, pin, userId, ts, state || null, verify || null, result],
    );
    if (!ins?.affectedRows || result !== 'applied') return; // duplicate re-send, or not applicable

    const start = hhmmToMinutes(cfg.timing.start);
    const lateBy = Math.max(0, minutes - start);
    let status = 'present';
    if (lateBy > cfg.timing.grace_minutes) status = 'late';
    if (cfg.timing.half_day_after_minutes > 0 && lateBy >= cfg.timing.half_day_after_minutes) status = 'half_day';
    const end = hhmmToMinutes(cfg.timing.end);

    // Store wall time converted to UTC instant for the configured timezone offset (IST default).
    const instant = wallTimeToDate(ts, cfg.timezone);
    const existing = (await this.db.query('SELECT * FROM staff_attendance WHERE user_id = ? AND date = ? LIMIT 1', [userId, date]))?.[0];

    if (!existing) {
      await this.db.query(
        `INSERT INTO staff_attendance (school_id, user_id, date, status, method, late_minutes, check_in_time, biometric_device_sn, created_at, updated_at)
         VALUES (?, ?, ?, ?, 'biometric', ?, ?, ?, NOW(), NOW())`,
        [schoolId, userId, date, status, status === 'present' ? 0 : lateBy, instant, d.serial_number],
      );
      return;
    }
    // Don't override an admin's manual decision (e.g. leave).
    if (existing.method === 'manual' && existing.marked_by) return;

    const inMs = existing.check_in_time ? new Date(existing.check_in_time).getTime() : null;
    if (inMs === null || instant.getTime() < inMs) {
      await this.db.query(
        `UPDATE staff_attendance SET check_in_time = ?, status = ?, late_minutes = ?, method = IF(method = 'manual', 'biometric', method),
         biometric_device_sn = ?, updated_at = NOW() WHERE id = ?`,
        [instant, status, status === 'present' ? 0 : lateBy, d.serial_number, existing.id],
      );
    } else if (instant.getTime() - inMs >= 5 * 60_000) {
      // Later punch (5+ min after check-in) = check-out; keep the latest.
      const outMs = existing.check_out_time ? new Date(existing.check_out_time).getTime() : 0;
      if (instant.getTime() > outMs) {
        await this.db.query('UPDATE staff_attendance SET check_out_time = ?, early_leave = ?, updated_at = NOW() WHERE id = ?', [
          instant, minutes < end ? 1 : 0, existing.id,
        ]);
      }
    }
  }
}

/** Convert a school-local "YYYY-MM-DD HH:mm:ss" into a real Date for that timezone. */
export function wallTimeToDate(ts: string, tz: string): Date {
  const asUtc = new Date(`${ts.replace(' ', 'T')}Z`);
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const p = Object.fromEntries(fmt.formatToParts(asUtc).map((x) => [x.type, x.value]));
  const seen = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return new Date(asUtc.getTime() - (seen - asUtc.getTime()));
}
