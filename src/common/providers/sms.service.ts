import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Generic SMS sender. Mirrors EmailService's philosophy: if no SMS gateway
 * is configured, it logs what would have been sent instead of throwing, so
 * local/dev keeps working end-to-end.
 *
 * Supports a simple HTTP gateway driven entirely by env (works with most
 * Indian providers like MSG91, Fast2SMS, TextLocal, Gupshup — set the URL
 * template and key). To integrate a specific provider's SDK later, swap the
 * body of `deliver()`.
 */
@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(private configService: ConfigService) {}

  private get provider(): string {
    return (this.configService.get('SMS_PROVIDER') || 'log').toLowerCase();
  }

  async send(phone: string, message: string): Promise<boolean> {
    const normalized = this.normalize(phone);

    if (this.provider === 'log' || !this.configService.get('SMS_API_URL')) {
      this.logger.warn(`SMS gateway not configured — would have sent to ${normalized}: "${message}"`);
      return false;
    }

    return this.deliver(normalized, message);
  }

  private async deliver(phone: string, message: string): Promise<boolean> {
    try {
      const urlTemplate = this.configService.get('SMS_API_URL') as string;
      const apiKey = this.configService.get('SMS_API_KEY') || '';
      const senderId = this.configService.get('SMS_SENDER_ID') || '';

      // Allow {phone}/{message}/{key}/{sender} placeholders in the URL template
      const url = urlTemplate
        .replace('{phone}', encodeURIComponent(phone))
        .replace('{message}', encodeURIComponent(message))
        .replace('{key}', encodeURIComponent(apiKey))
        .replace('{sender}', encodeURIComponent(senderId));

      const res = await fetch(url, { method: 'GET' });
      if (!res.ok) {
        this.logger.error(`SMS send failed (${res.status}) to ${phone}`);
        return false;
      }
      return true;
    } catch (e: any) {
      this.logger.error(`SMS send error to ${phone}: ${e.message}`);
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
