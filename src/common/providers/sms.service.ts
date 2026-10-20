import { Injectable, Logger } from '@nestjs/common';
import { PlatformSettingsService } from './platform-settings.service';

/**
 * Generic HTTP SMS sender driven by Admin → Integrations → SMS
 * (platform_settings), with the legacy SMS_* .env keys as fallback.
 *
 * Works with most Indian providers (MSG91, Fast2SMS, TextLocal, Gupshup) via a
 * URL template with {phone} {message} {key} {sender} placeholders.
 * If no gateway is configured it logs instead of sending (dev-safe).
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private readonly settings: PlatformSettingsService) {}

  async send(phone: string, message: string): Promise<boolean> {
    const normalized = this.normalize(phone);
    const s = await this.settings.group('sms', ['provider', 'api_url', 'api_key', 'sender_id'] as const);

    if ((s.provider || 'log').toLowerCase() === 'log' || !s.api_url) {
      this.logger.warn(`SMS gateway not configured — would have sent to ${normalized}: "${message}"`);
      return false;
    }

    try {
      const url = s.api_url
        .split('{phone}').join(encodeURIComponent(normalized))
        .split('{message}').join(encodeURIComponent(message))
        .split('{key}').join(encodeURIComponent(s.api_key || ''))
        .split('{sender}').join(encodeURIComponent(s.sender_id || ''));

      const res = await fetch(url, { method: 'GET', signal: AbortSignal.timeout(10_000) });
      if (!res.ok) {
        this.logger.error(`SMS send failed (${res.status}) to ${normalized}`);
        return false;
      }
      return true;
    } catch (e: any) {
      this.logger.error(`SMS send error to ${normalized}: ${e.message}`);
      return false;
    }
  }

  /** Strip spaces/dashes; keep a leading + if present. */
  private normalize(phone: string): string {
    const trimmed = (phone || '').trim();
    const plus = trimmed.startsWith('+');
    const digits = trimmed.replace(/[^\d]/g, '');
    return plus ? `+${digits}` : digits;
  }
}
