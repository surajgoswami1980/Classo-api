import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';

export interface FcmSendResult {
  successCount: number;
  failureCount: number;
  // tokens FCM reported as permanently invalid — caller should deactivate them
  invalidTokens: string[];
}

/**
 * FCM push sender. Firebase Admin is loaded lazily via require() so the API
 * compiles and runs WITHOUT the `firebase-admin` package installed. When
 * both the package and a service-account are present it sends real pushes;
 * otherwise it logs what it would have sent (dev-safe), exactly like the
 * SMS/email services.
 *
 * To enable real push:
 *   1) npm i firebase-admin
 *   2) set FIREBASE_SERVICE_ACCOUNT=/abs/path/to/serviceAccount.json
 *      (or FIREBASE_SERVICE_ACCOUNT_JSON='{...}')
 */
@Injectable()
export class FirebaseService {
  private readonly logger = new Logger(FirebaseService.name);
  private app: any = null;
  private messaging: any = null;
  private initialized = false;

  constructor(private config: ConfigService) {}

  private init(): void {
    if (this.initialized) return;
    this.initialized = true;

    let admin: any;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      admin = require('firebase-admin');
    } catch {
      this.logger.warn('firebase-admin not installed — push notifications run in log-only mode.');
      return;
    }

    const credsJson = this.config.get('FIREBASE_SERVICE_ACCOUNT_JSON');
    const credsPath = this.config.get('FIREBASE_SERVICE_ACCOUNT');

    let serviceAccount: any = null;
    try {
      if (credsJson) {
        serviceAccount = JSON.parse(credsJson);
      } else if (credsPath && fs.existsSync(credsPath)) {
        serviceAccount = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
      }
    } catch (e: any) {
      this.logger.error(`Failed to parse Firebase service account: ${e.message}`);
    }

    if (!serviceAccount) {
      this.logger.warn('No Firebase service account configured — push runs in log-only mode.');
      return;
    }

    try {
      this.app = admin.apps?.length
        ? admin.app()
        : admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      this.messaging = this.app.messaging();
      this.logger.log('Firebase Admin initialized — push notifications are live.');
    } catch (e: any) {
      this.logger.error(`Firebase init failed: ${e.message}`);
    }
  }

  get isLive(): boolean {
    this.init();
    return !!this.messaging;
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
    this.init();
    const unique = [...new Set(tokens.filter(Boolean))];
    if (unique.length === 0) {
      return { successCount: 0, failureCount: 0, invalidTokens: [] };
    }

    if (!this.messaging) {
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
        const res = await this.messaging.sendEachForMulticast({
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
