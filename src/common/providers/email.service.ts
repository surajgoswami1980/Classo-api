import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

/**
 * Thin wrapper around AWS SES. Mirrors the rest of this codebase's
 * "never let an unconfigured external dependency break the request"
 * philosophy (see RedisService usage in AuthService.login): if AWS
 * credentials aren't set, this logs what would have been sent instead
 * of throwing, so local/dev environments keep working end-to-end.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private client: SESClient | null = null;

  constructor(private configService: ConfigService) {
    const accessKeyId = this.configService.get('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get('AWS_SECRET_ACCESS_KEY');

    if (accessKeyId && secretAccessKey) {
      this.client = new SESClient({
        region: this.configService.get('AWS_REGION') || 'ap-south-1',
        credentials: { accessKeyId, secretAccessKey },
      });
    }
  }

  async send(to: string, subject: string, htmlBody: string): Promise<void> {
    if (!this.client) {
      this.logger.warn(`SES not configured — would have sent to ${to}: "${subject}"\n${htmlBody}`);
      return;
    }

    try {
      await this.client.send(
        new SendEmailCommand({
          Source: this.configService.get('SES_FROM_EMAIL') || 'no-reply@schoolerp.com',
          Destination: { ToAddresses: [to] },
          Message: {
            Subject: { Data: subject },
            Body: { Html: { Data: htmlBody } },
          },
        }),
      );
    } catch (e) {
      this.logger.error(`Failed to send email to ${to}: ${e.message}`);
    }
  }
}
