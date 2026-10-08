import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { RedisService } from './redis.service';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';

export type OtpChannel = 'email' | 'mobile';
export type OtpPurpose = 'login' | 'verify';

const OTP_TTL_SECONDS = 300; // 5 minutes
const RESEND_COOLDOWN_SECONDS = 30;
const MAX_ATTEMPTS = 5;
const MAX_SENDS_PER_HOUR = 8;

/**
 * Redis-backed OTP generation + verification used by both the web portal
 * (student/teacher/parent) and the admin panel (school-admin/sub-admin).
 *
 * Keys:
 *   otp:code:<channel>:<destination>    -> { hash, attempts, purpose }
 *   otp:cooldown:<channel>:<destination>-> 1 (resend throttle)
 *   otp:rate:<channel>:<destination>    -> count (per-hour send cap)
 *
 * A configurable SUPER_OTP (env) always verifies — intended for demos and
 * QA so the product can be shown without a live SMS/email gateway. Disable
 * by leaving SUPER_OTP empty in production.
 */
@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly email: EmailService,
    private readonly sms: SmsService,
    private readonly config: ConfigService,
  ) {}

  private codeKey(channel: OtpChannel, destination: string) {
    return `otp:code:${channel}:${destination.toLowerCase()}`;
  }
  private cooldownKey(channel: OtpChannel, destination: string) {
    return `otp:cooldown:${channel}:${destination.toLowerCase()}`;
  }
  private rateKey(channel: OtpChannel, destination: string) {
    return `otp:rate:${channel}:${destination.toLowerCase()}`;
  }

  private hash(code: string): string {
    return crypto.createHash('sha256').update(code).digest('hex');
  }

  private generateCode(): string {
    // 6-digit numeric, no leading-zero bias
    return crypto.randomInt(100000, 1000000).toString();
  }

  private get superOtp(): string | null {
    const v = (this.config.get('SUPER_OTP') || '').toString().trim();
    return v.length > 0 ? v : null;
  }

  private get devEcho(): boolean {
    // When true, the generated OTP is returned in the API response so the
    // flow is testable without a real gateway. Defaults ON in non-production.
    const explicit = this.config.get('OTP_DEV_ECHO');
    if (explicit !== undefined) return String(explicit) === 'true';
    return (this.config.get('NODE_ENV') || 'development') !== 'production';
  }

  /**
   * Generate + deliver an OTP. Returns metadata (and, in dev, the code).
   */
  async request(
    channel: OtpChannel,
    destination: string,
    purpose: OtpPurpose,
    recipientName?: string,
  ): Promise<{ sent: boolean; cooldown: number; dev_otp?: string }> {
    if (!destination) {
      throw new BadRequestException('A destination (email or mobile) is required.');
    }

    // Resend cooldown
    const onCooldown = await this.safe(() => this.redis.exists(this.cooldownKey(channel, destination)));
    if (onCooldown) {
      throw new BadRequestException(`Please wait before requesting another code.`);
    }

    // Per-hour send cap
    const rateKey = this.rateKey(channel, destination);
    const sends = await this.safe(() => this.redis.incr(rateKey));
    if (sends === 1) {
      await this.safe(() => this.redis.expire(rateKey, 3600));
    }
    if (sends && sends > MAX_SENDS_PER_HOUR) {
      throw new BadRequestException('Too many OTP requests. Try again later.');
    }

    const code = this.generateCode();
    const payload = JSON.stringify({ hash: this.hash(code), attempts: 0, purpose });
    await this.safe(() => this.redis.set(this.codeKey(channel, destination), payload, OTP_TTL_SECONDS));
    await this.safe(() => this.redis.set(this.cooldownKey(channel, destination), '1', RESEND_COOLDOWN_SECONDS));

    const message = `Your School ERP ${purpose === 'login' ? 'login' : 'verification'} OTP is ${code}. It is valid for 5 minutes. Do not share it with anyone.`;

    let sent = false;
    if (channel === 'email') {
      await this.email.send(
        destination,
        'Your School ERP OTP',
        `<p>Hi ${recipientName || 'there'},</p><p>Your One-Time Password is:</p><h2 style="letter-spacing:4px">${code}</h2><p>It is valid for 5 minutes. Do not share it with anyone.</p>`,
      );
      sent = true; // email service logs if unconfigured
    } else {
      sent = await this.sms.send(destination, message);
    }

    if (this.devEcho) {
      this.logger.warn(`[DEV] OTP for ${channel} ${destination}: ${code}`);
    }

    return {
      sent,
      cooldown: RESEND_COOLDOWN_SECONDS,
      ...(this.devEcho ? { dev_otp: code } : {}),
    };
  }

  /**
   * Verify an OTP. Consumes the code on success. Honors SUPER_OTP.
   */
  async verify(channel: OtpChannel, destination: string, code: string): Promise<boolean> {
    if (!code) throw new BadRequestException('Enter the OTP.');

    // Super OTP bypass (demo/QA)
    const superOtp = this.superOtp;
    if (superOtp && code === superOtp) {
      await this.safe(() => this.redis.del(this.codeKey(channel, destination)));
      return true;
    }

    const key = this.codeKey(channel, destination);
    const raw = await this.safe(() => this.redis.get(key));
    if (!raw) {
      throw new BadRequestException('OTP expired or not requested. Please request a new one.');
    }

    let data: { hash: string; attempts: number; purpose: string };
    try {
      data = JSON.parse(raw);
    } catch {
      await this.safe(() => this.redis.del(key));
      throw new BadRequestException('OTP is invalid. Please request a new one.');
    }

    if (data.attempts >= MAX_ATTEMPTS) {
      await this.safe(() => this.redis.del(key));
      throw new BadRequestException('Too many incorrect attempts. Please request a new OTP.');
    }

    if (this.hash(code) !== data.hash) {
      data.attempts += 1;
      await this.safe(() => this.redis.set(key, JSON.stringify(data), OTP_TTL_SECONDS));
      throw new BadRequestException(`Incorrect OTP. ${MAX_ATTEMPTS - data.attempts} attempt(s) left.`);
    }

    await this.safe(() => this.redis.del(key));
    return true;
  }

  /** Never let a Redis hiccup throw out of the OTP flow. */
  private async safe<T>(fn: () => Promise<T> | T): Promise<T | undefined> {
    try {
      return await fn();
    } catch (e: any) {
      this.logger.error(`OTP Redis op failed: ${e?.message}`);
      return undefined;
    }
  }
}
