import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { PlatformSettingsService } from '../../common/providers/platform-settings.service';

export interface FcmSendResult {
  successCount: number;
  failureCount: number;
  // tokens FCM reported as permanently invalid — caller should deactivate them
  invalidTokens: string[];
}

/**
 * FCM push sender. The service account comes from Admin → Integrations →
 * Firebase (platform_settings), falling back to FIREBASE_SERVICE_ACCOUNT_JSON
 * or the FIREBASE_SERVICE_ACCOUNT file path in .env.
 *
 * firebase-admin is loaded lazily so the API runs without it installed
 * (`npm i firebase-admin` to send real pushes). Without it, or without a
 * service account, pushes are logged instead (dev-safe).
 *
 * Saving a new service account in the panel re-initialises Firebase on the
 * next send (settings cache is ~60s) — no restart needed.
 */
@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);
  private messaging: any = null;
  private credsHash: string | null = null;
  private appSeq = 0;
  private warnedMissingPkg = false;

  constructor(
    private config: ConfigService,
    private settings: PlatformSettingsService,
  ) {}

  private async serviceAccountJson(): Promise<string | null> {
    const fromPanel = await this.settings.get('firebase', 'service_account_json');
    if (fromPanel) return fromPanel;
    const path = this.config.get('FIREBASE_SERVICE_ACCOUNT');
    if (path && fs.existsSync(path)) return fs.readFileSync(path, 'utf8');
    return null;
  }

  /** Returns a live messaging client, or null in log-only mode. */
  private async getMessaging(): Promise<any> {
    if (!(await this.settings.bool('firebase', 'enabled'))) return null;

    const json = await this.serviceAccountJson();
    if (!json) return null;
    const hash = crypto.createHash('sha256').update(json).digest('hex');
    if (this.messaging && this.credsHash === hash) return this.messaging;

    let admin: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      admin = require('firebase-admin');
    } catch {
      if (!this.warnedMissingPkg) {
        this.logger.warn('firebase-admin not installed — push notifications run in log-only mode.');
        this.warnedMissingPkg = true;
      }
      return null;
    }

    try {
      const serviceAccount = JSON.parse(json);
      // A fresh named app per credential set, so a key change in the panel takes effect.
      const app = admin.initializeApp(
        { credential: admin.credential.cert(serviceAccount) },
        `quilo-${++this.appSeq}`,
      );
      this.messaging = app.messaging();
      this.credsHash = hash;
      this.logger.log(`Firebase initialised for project ${serviceAccount.project_id || '(unknown)'} — push is live.`);
      return this.messaging;
    } catch (e: any) {
      this.logger.error(`Firebase init failed: ${e.message}`);
      this.messaging = null;
      this.credsHash = hash; // don't retry a broken key on every send
      return null;
    }
  }

  async isLive(): Promise<boolean> {
    return !!(await this.getMessaging());
  }

  /**
   * Send a multicast push to many tokens. Returns per-token outcome so the
   * caller can deactivate invalid tokens. In log-only mode returns a success
   * for each token without sending.
   */
  async sendToTokens(
    tokens: string[],
    title: string,
    body: string,
    data: Record<string, string> = {},
  ): Promise<FcmSendResult> {
    const unique = [...new Set(tokens.filter(Boolean))];
    if (unique.length === 0) {
      return { successCount: 0, failureCount: 0, invalidTokens: [] };
    }

    const messaging = await this.getMessaging();
    if (!messaging) {
      this.logger.warn(`[DEV push] "${title}" → ${unique.length} token(s): ${body}`);
      return { successCount: unique.length, failureCount: 0, invalidTokens: [] };
    }

    const invalidTokens: string[] = [];
    let successCount = 0;
    let failureCount = 0;

    // FCM multicast caps at 500 tokens per call.
    for (let i = 0; i < unique.length; i += 500) {
      const batch = unique.slice(i, i + 500);
      try {
        const res = await messaging.sendEachForMulticast({
          tokens: batch,
          notification: { title, body },
          data,
          android: { priority: 'high' },
        });
        successCount += res.successCount;
        failureCount += res.failureCount;
        res.responses.forEach((r: any, idx: number) => {
          if (!r.success) {
            const code = r.error?.code || '';
            if (code.includes('registration-token-not-registered') || code.includes('invalid-argument')) {
              invalidTokens.push(batch[idx]);
            }
          }
        });
      } catch (e: any) {
        failureCount += batch.length;
        this.logger.error(`FCM batch send failed: ${e.message}`);
      }
    }

    return { successCount, failureCount, invalidTokens };
  }
}
