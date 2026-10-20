import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Global platform credentials saved by the super admin
 * (Admin → Integrations). Table: platform_settings.
 *
 * Lookup order: panel value → legacy .env variable → default.
 * Secrets are AES-256-GCM encrypted by the Laravel admin with
 * SETTINGS_ENCRYPTION_KEY (same base64 key in both .env files).
 * Format: v1:<iv b64>:<tag b64>:<ciphertext b64>
 *
 * Keep ENV_FALLBACK in sync with App\Support\PlatformSettings::definitions().
 */
const ENV_FALLBACK: Record<string, { env?: string; default?: string }> = {
  'payment.gateway': { env: 'PAYMENT_GATEWAY', default: 'razorpay' },
  'payment.platform_fee_percent': { env: 'PLATFORM_FEE_PERCENT', default: '1.5' },
  'payment.gateway_fee_percent': { env: 'GATEWAY_FEE_PERCENT', default: '2' },

  'razorpay.key_id': { env: 'RAZORPAY_KEY_ID' },
  'razorpay.key_secret': { env: 'RAZORPAY_KEY_SECRET' },
  'razorpay.webhook_secret': { env: 'RAZORPAY_WEBHOOK_SECRET' },
  'razorpay.route_enabled': { default: '1' },

  'cashfree.env': { env: 'CASHFREE_ENV', default: 'TEST' },
  'cashfree.app_id': { env: 'CASHFREE_APP_ID' },
  'cashfree.secret_key': { env: 'CASHFREE_SECRET_KEY' },
  'cashfree.split_enabled': { default: '1' },

  'firebase.enabled': { default: '1' },
  'firebase.service_account_json': { env: 'FIREBASE_SERVICE_ACCOUNT_JSON' },

  'email.driver': {},
  'email.from_address': { env: 'SES_FROM_EMAIL' },
  'email.from_name': { default: 'MyClasses' },
  'email.smtp_host': {},
  'email.smtp_port': { default: '587' },
  'email.smtp_encryption': { default: 'tls' },
  'email.smtp_username': {},
  'email.smtp_password': {},
  'email.ses_region': { env: 'AWS_REGION', default: 'ap-south-1' },
  'email.ses_access_key': { env: 'AWS_ACCESS_KEY_ID' },
  'email.ses_secret_key': { env: 'AWS_SECRET_ACCESS_KEY' },

  'sms.provider': { env: 'SMS_PROVIDER', default: 'log' },
  'sms.api_url': { env: 'SMS_API_URL' },
  'sms.api_key': { env: 'SMS_API_KEY' },
  'sms.sender_id': { env: 'SMS_SENDER_ID' },
};

@Injectable()
export class PlatformSettingsService {
  private readonly logger = new Logger(PlatformSettingsService.name);
  private cache: { values: Map<string, string>; at: number } | null = null;
  private loading: Promise<Map<string, string>> | null = null;
  private warnedKey = false;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  private key(): Buffer | null {
    let raw = String(this.config.get('SETTINGS_ENCRYPTION_KEY') || '');
    if (raw.startsWith('base64:')) raw = raw.slice(7);
    const key = raw ? Buffer.from(raw, 'base64') : null;
    if (!key || key.length !== 32) {
      if (!this.warnedKey) {
        this.logger.warn('SETTINGS_ENCRYPTION_KEY missing/invalid — encrypted panel secrets are ignored (falling back to .env).');
        this.warnedKey = true;
      }
      return null;
    }
    return key;
  }

  private decrypt(stored: string): string | null {
    const key = this.key();
    if (!key || !stored) return null;
    const parts = stored.split(':');
    if (parts.length !== 4 || parts[0] !== 'v1') return null;
    try {
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(parts[1], 'base64'));
      decipher.setAuthTag(Buffer.from(parts[2], 'base64'));
      return Buffer.concat([decipher.update(Buffer.from(parts[3], 'base64')), decipher.final()]).toString('utf8');
    } catch {
      this.logger.error('Could not decrypt a platform setting — check SETTINGS_ENCRYPTION_KEY matches the admin panel.');
      return null;
    }
  }

  private async load(): Promise<Map<string, string>> {
    if (this.cache && Date.now() - this.cache.at < 60_000) return this.cache.values;
    if (this.loading) return this.loading;

    this.loading = (async () => {
      const values = new Map<string, string>();
      try {
        const rows: any[] = await this.dataSource.query(
          'SELECT group_name, setting_key, value, is_secret FROM platform_settings',
        );
        for (const r of rows) {
          const v = Number(r.is_secret) ? this.decrypt(r.value) : r.value;
          if (v !== null && v !== undefined && v !== '') values.set(`${r.group_name}.${r.setting_key}`, String(v));
        }
      } catch (e: any) {
        // Table not migrated yet → behave exactly like before (env only).
        if (!String(e?.message || '').includes("doesn't exist")) {
          this.logger.error(`Loading platform settings failed: ${e?.message}`);
        }
      }
      this.cache = { values, at: Date.now() };
      return values;
    })();

    try {
      return await this.loading;
    } finally {
      this.loading = null;
    }
  }

  /** Panel value → .env → default → undefined. */
  async get(group: string, key: string): Promise<string | undefined> {
    const full = `${group}.${key}`;
    const values = await this.load();
    if (values.has(full)) return values.get(full);
    const fb = ENV_FALLBACK[full] || {};
    if (fb.env) {
      const env = this.config.get(fb.env);
      if (env !== undefined && env !== null && String(env) !== '') return String(env);
    }
    return fb.default;
  }

  /** True when the super admin has saved this key in the panel. */
  async isStored(group: string, key: string): Promise<boolean> {
    return (await this.load()).has(`${group}.${key}`);
  }

  async bool(group: string, key: string): Promise<boolean> {
    const v = String((await this.get(group, key)) ?? '').toLowerCase();
    return v === '1' || v === 'true' || v === 'yes' || v === 'on';
  }

  async number(group: string, key: string, fallback: number): Promise<number> {
    const n = Number(await this.get(group, key));
    return Number.isFinite(n) && n >= 0 ? n : fallback;
  }

  /** Read several keys of one group at once. */
  async group<K extends string>(group: string, keys: readonly K[]): Promise<Record<K, string | undefined>> {
    const out = {} as Record<K, string | undefined>;
    for (const k of keys) out[k] = await this.get(group, k);
    return out;
  }

  invalidate() {
    this.cache = null;
  }
}
