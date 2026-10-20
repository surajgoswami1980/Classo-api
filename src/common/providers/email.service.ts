import { Injectable, Logger } from '@nestjs/common';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { PlatformSettingsService } from './platform-settings.service';

/**
 * Email sender driven by Admin → Integrations → Email (platform_settings),
 * with the legacy AWS_* / SES_FROM_EMAIL .env keys as fallback.
 *
 * Providers:
 *  - ses  : AWS SES via @aws-sdk/client-ses (installed)
 *  - smtp : any SMTP server via nodemailer (loaded lazily — `npm i nodemailer`)
 *  - log  : prints instead of sending (dev-safe default)
 *
 * Never throws for delivery problems; it logs, like before.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private ses: { client: SESClient; sig: string } | null = null;
  private smtp: { transport: any; sig: string } | null = null;

  constructor(private readonly settings: PlatformSettingsService) {}

  private async driver(): Promise<'ses' | 'smtp' | 'log'> {
    const d = await this.settings.get('email', 'driver');
    if (d === 'ses' || d === 'smtp' || d === 'log') return d;
    // Legacy: no driver saved → SES if AWS keys exist in .env.
    return (await this.settings.get('email', 'ses_access_key')) ? 'ses' : 'log';
  }

  private async from(): Promise<string> {
    const address = (await this.settings.get('email', 'from_address')) || 'no-reply@quilo.app';
    const name = await this.settings.get('email', 'from_name');
    return name ? `"${name.replace(/"/g, '')}" <${address}>` : address;
  }

  async send(to: string, subject: string, htmlBody: string): Promise<void> {
    const driver = await this.driver();
    try {
      if (driver === 'ses') return await this.sendSes(to, subject, htmlBody);
      if (driver === 'smtp') return await this.sendSmtp(to, subject, htmlBody);
    } catch (e: any) {
      this.logger.error(`Failed to send email to ${to} via ${driver}: ${e.message}`);
      return;
    }
    this.logger.warn(`Email not configured — would have sent to ${to}: "${subject}"\n${htmlBody}`);
  }

  private async sendSes(to: string, subject: string, html: string) {
    const s = await this.settings.group('email', ['ses_access_key', 'ses_secret_key', 'ses_region'] as const);
    if (!s.ses_access_key || !s.ses_secret_key) {
      this.logger.warn(`SES selected but keys are missing — would have sent to ${to}: "${subject}"`);
      return;
    }
    const sig = `${s.ses_access_key}|${s.ses_secret_key}|${s.ses_region}`;
    if (!this.ses || this.ses.sig !== sig) {
      this.ses = {
        client: new SESClient({
          region: s.ses_region || 'ap-south-1',
          credentials: { accessKeyId: s.ses_access_key, secretAccessKey: s.ses_secret_key },
        }),
        sig,
      };
    }
    await this.ses.client.send(
      new SendEmailCommand({
        Source: await this.from(),
        Destination: { ToAddresses: [to] },
        Message: { Subject: { Data: subject }, Body: { Html: { Data: html } } },
      }),
    );
  }

  private async sendSmtp(to: string, subject: string, html: string) {
    let nodemailer: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      nodemailer = require('nodemailer');
    } catch {
      this.logger.warn('SMTP selected but nodemailer is not installed (npm i nodemailer) — email not sent.');
      return;
    }
    const s = await this.settings.group('email', [
      'smtp_host', 'smtp_port', 'smtp_encryption', 'smtp_username', 'smtp_password',
    ] as const);
    if (!s.smtp_host) {
      this.logger.warn(`SMTP selected but host is missing — would have sent to ${to}: "${subject}"`);
      return;
    }
    const sig = JSON.stringify(s);
    if (!this.smtp || this.smtp.sig !== sig) {
      this.smtp = {
        transport: nodemailer.createTransport({
          host: s.smtp_host,
          port: Number(s.smtp_port) || 587,
          secure: s.smtp_encryption === 'ssl',
          requireTLS: s.smtp_encryption === 'tls',
          auth: s.smtp_username ? { user: s.smtp_username, pass: s.smtp_password } : undefined,
        }),
        sig,
      };
    }
    await this.smtp.transport.sendMail({ from: await this.from(), to, subject, html });
  }
}
