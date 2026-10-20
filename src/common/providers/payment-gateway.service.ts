import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { PlatformSettingsService } from './platform-settings.service';

const Razorpay = require('razorpay');
const crypto = require('crypto');

export type GatewayProvider = 'razorpay' | 'cashfree';

/**
 * Split status lifecycle stored on payment_transactions / store_orders:
 *  - pending   : order created with an automatic split, payment not done yet
 *  - scheduled : paid; gateway will transfer the school share (Route / Easy Split)
 *  - processed : gateway confirmed the transfer to the school (webhook)
 *  - failed    : gateway reported the transfer failed (webhook)
 *  - manual    : school has no split data; full amount is held in the platform
 *                account and the school share must be settled manually
 */
export type SplitStatus = 'pending' | 'scheduled' | 'processed' | 'failed' | 'manual';

export interface SplitBreakdown {
  amount: number;
  platform_fee: number;
  gateway_fee: number;
  school_share: number;
  /** Linked account (acc_...) or Cashfree vendor id, null when not configured. */
  split_account: string | null;
  split_status: SplitStatus;
}

export interface CreatedOrder extends SplitBreakdown {
  provider: GatewayProvider;
  order_id: string;
  currency: 'INR';
  /** Razorpay checkout key (public). */
  key?: string;
  /** Cashfree checkout session. */
  payment_session_id?: string;
  env?: 'TEST' | 'PROD';
}

interface SchoolSplitConfig {
  split_enabled: boolean;
  razorpay_linked_account_id: string | null;
  cashfree_vendor_id: string | null;
  platform_fee_percent: number | null;
  gateway_fee_percent: number | null;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * ONE platform payment gateway (configured in .env) collects every online
 * payment. Schools never hold their own keys — they only carry split data:
 *
 *   Razorpay → Route: order.transfers to the school's linked account
 *   Cashfree → Easy Split: order_splits to the school's vendor id
 *
 * School share = amount − platform fee − gateway (route/split) fee.
 * If a school has no split data, the payment still goes through on the
 * platform gateway and is flagged split_status = 'manual'.
 *
 * Credentials, default gateway and fees come from Admin → Integrations
 * (platform_settings), falling back to the legacy .env keys.
 */
@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);
  private cache = new Map<number, { cfg: SchoolSplitConfig; at: number }>();
  private razorpay: { client: any; keyId: string; keySecret: string } | null = null;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly config: ConfigService,
    private readonly settings: PlatformSettingsService,
  ) {}

  // ─── Platform gateway ──────────────────────────────────────────

  async provider(): Promise<GatewayProvider> {
    const p = String((await this.settings.get('payment', 'gateway')) || 'razorpay').toLowerCase();
    return p === 'cashfree' ? 'cashfree' : 'razorpay';
  }

  /** Platform Razorpay client (also used for subscription billing). Rebuilt when keys change. */
  async platformRazorpay() {
    const keyId = await this.settings.get('razorpay', 'key_id');
    const keySecret = await this.settings.get('razorpay', 'key_secret');
    if (!keyId || !keySecret) {
      throw new BadRequestException('Razorpay is not configured. Add the keys in Admin → Integrations.');
    }
    if (!this.razorpay || this.razorpay.keyId !== keyId || this.razorpay.keySecret !== keySecret) {
      this.razorpay = { client: new Razorpay({ key_id: keyId, key_secret: keySecret }), keyId, keySecret };
    }
    return this.razorpay.client;
  }

  async platformKeyId(): Promise<string | undefined> {
    return this.settings.get('razorpay', 'key_id');
  }

  private async cashfree() {
    const appId = await this.settings.get('cashfree', 'app_id');
    const secret = await this.settings.get('cashfree', 'secret_key');
    if (!appId || !secret) {
      throw new BadRequestException('Cashfree is not configured. Add the keys in Admin → Integrations.');
    }
    const env: 'TEST' | 'PROD' = (await this.settings.get('cashfree', 'env')) === 'PROD' ? 'PROD' : 'TEST';
    return {
      env,
      base: env === 'PROD' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': appId,
        'x-client-secret': secret,
      },
    };
  }

  // ─── School split config ───────────────────────────────────────

  private async splitConfig(schoolId: number): Promise<SchoolSplitConfig> {
    const cached = this.cache.get(schoolId);
    if (cached && Date.now() - cached.at < 60_000) return cached.cfg;

    const rows = await this.dataSource.query(
      `SELECT split_enabled, razorpay_linked_account_id, cashfree_vendor_id,
              platform_fee_percent, gateway_fee_percent
       FROM payment_settings WHERE school_id = ? LIMIT 1`,
      [schoolId],
    );
    const s = rows?.[0];
    const cfg: SchoolSplitConfig = {
      split_enabled: Boolean(Number(s?.split_enabled ?? 0)),
      razorpay_linked_account_id: s?.razorpay_linked_account_id?.trim() || null,
      cashfree_vendor_id: s?.cashfree_vendor_id?.trim() || null,
      platform_fee_percent: s?.platform_fee_percent != null ? Number(s.platform_fee_percent) : null,
      gateway_fee_percent: s?.gateway_fee_percent != null ? Number(s.gateway_fee_percent) : null,
    };
    this.cache.set(schoolId, { cfg, at: Date.now() });
    return cfg;
  }

  /** Is the platform-level split product (Route / Easy Split) switched on? */
  async splitProductEnabled(provider?: GatewayProvider): Promise<boolean> {
    const p = provider || (await this.provider());
    return p === 'razorpay'
      ? this.settings.bool('razorpay', 'route_enabled')
      : this.settings.bool('cashfree', 'split_enabled');
  }

  /** Work out platform fee, gateway fee and the school's share for an amount. */
  async calculateSplit(schoolId: number, amountRupees: number): Promise<SplitBreakdown> {
    const cfg = await this.splitConfig(schoolId);
    const provider = await this.provider();
    const amount = round2(amountRupees);
    const platformPct = cfg.platform_fee_percent ?? (await this.settings.number('payment', 'platform_fee_percent', 1.5));
    const gatewayPct = cfg.gateway_fee_percent ?? (await this.settings.number('payment', 'gateway_fee_percent', 2));

    const platform_fee = round2((amount * platformPct) / 100);
    const gateway_fee = round2((amount * gatewayPct) / 100);
    const school_share = round2(Math.max(0, amount - platform_fee - gateway_fee));

    const account = provider === 'razorpay' ? cfg.razorpay_linked_account_id : cfg.cashfree_vendor_id;
    const auto =
      (await this.splitProductEnabled(provider)) && cfg.split_enabled && !!account && school_share > 0;

    return {
      amount,
      platform_fee,
      gateway_fee,
      school_share,
      split_account: auto ? account : null,
      split_status: auto ? 'pending' : 'manual',
    };
  }

  // ─── Orders ────────────────────────────────────────────────────

  /**
   * Create an order on the platform gateway with the school's split attached.
   * Fee, store and event payments all go through here.
   */
  async createOrder(
    schoolId: number,
    amountRupees: number,
    receipt: string,
    notes: Record<string, any> = {},
  ): Promise<CreatedOrder> {
    if (!(amountRupees > 0)) throw new BadRequestException('Payment amount must be greater than 0.');
    const split = await this.calculateSplit(schoolId, amountRupees);

    if ((await this.provider()) === 'razorpay') {
      const payload: any = {
        amount: Math.round(split.amount * 100),
        currency: 'INR',
        receipt: receipt.slice(0, 40),
        notes: this.razorpayNotes({ ...notes, school_id: schoolId }),
      };
      if (split.split_account) {
        payload.transfers = [
          {
            account: split.split_account,
            amount: Math.round(split.school_share * 100),
            currency: 'INR',
            notes: this.razorpayNotes({ school_id: schoolId, receipt }),
            on_hold: false,
          },
        ];
      }
      const client = await this.platformRazorpay();
      let order: any;
      try {
        order = await client.orders.create(payload);
      } catch (e: any) {
        const msg = e?.error?.description || e?.message || 'Razorpay order creation failed.';
        if (!payload.transfers) {
          this.logger.error(`Razorpay order failed (school ${schoolId}): ${msg}`);
          throw new BadRequestException(msg);
        }
        // Route rejected the split (e.g. linked account not activated / suspended).
        // Never block the parent: collect on the platform account and settle manually.
        this.logger.warn(`Route split rejected for school ${schoolId} (${split.split_account}): ${msg} — falling back to platform account.`);
        delete payload.transfers;
        try {
          order = await client.orders.create(payload);
        } catch (e2: any) {
          const msg2 = e2?.error?.description || e2?.message || 'Razorpay order creation failed.';
          this.logger.error(`Razorpay order failed (school ${schoolId}): ${msg2}`);
          throw new BadRequestException(msg2);
        }
        split.split_account = null;
        split.split_status = 'manual';
      }
      return { ...split, provider: 'razorpay', order_id: order.id, key: await this.platformKeyId(), currency: 'INR' };
    }

    // Cashfree — order ids must be unique per merchant, so namespace by school.
    const cf = await this.cashfree();
    const orderId = `${receipt}`.replace(/[^A-Za-z0-9_-]/g, '-').slice(0, 45);
    const body: any = {
      order_id: orderId,
      order_amount: split.amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: `u${notes.user_id || notes.student_id || 'guest'}`,
        customer_phone: String(notes.phone || '').replace(/\D/g, '').slice(-10) || '9999999999',
        customer_email: notes.email || undefined,
        customer_name: notes.name || undefined,
      },
      order_tags: { school_id: String(schoolId) },
    };
    if (split.split_account) {
      body.order_splits = [{ vendor_id: split.split_account, amount: split.school_share }];
    }

    let resp = await fetch(`${cf.base}/orders`, { method: 'POST', headers: cf.headers, body: JSON.stringify(body) });
    let data: any = await resp.json().catch(() => ({}));
    if ((!resp.ok || !data.payment_session_id) && body.order_splits) {
      // Easy Split rejected the vendor (inactive / not verified). Don't block the parent.
      this.logger.warn(`Easy Split rejected for school ${schoolId} (${split.split_account}): ${data.message || resp.status} — falling back to platform account.`);
      delete body.order_splits;
      resp = await fetch(`${cf.base}/orders`, { method: 'POST', headers: cf.headers, body: JSON.stringify(body) });
      data = await resp.json().catch(() => ({}));
      split.split_account = null;
      split.split_status = 'manual';
    }
    if (!resp.ok || !data.payment_session_id) {
      this.logger.error(`Cashfree order failed (school ${schoolId}): ${JSON.stringify(data)}`);
      throw new BadRequestException(data.message || 'Cashfree order creation failed.');
    }
    return {
      ...split,
      provider: 'cashfree',
      order_id: data.order_id || orderId,
      payment_session_id: data.payment_session_id,
      env: cf.env,
      currency: 'INR',
    };
  }

  /** Razorpay notes: max 15 keys, string values up to 256 chars. */
  private razorpayNotes(notes: Record<string, any>) {
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(notes).slice(0, 15)) {
      if (v === undefined || v === null || v === '') continue;
      out[k] = String(v).slice(0, 250);
    }
    return out;
  }

  // ─── Verification ──────────────────────────────────────────────

  /** Verify a Razorpay checkout signature with the platform secret. */
  async verifyRazorpaySignature(orderId?: string, paymentId?: string, signature?: string): Promise<boolean> {
    const secret = await this.settings.get('razorpay', 'key_secret');
    if (!secret || !orderId || !paymentId || !signature) return false;
    const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
    return this.safeEqual(expected, signature);
  }

  /** Confirm a Cashfree order is PAID and for the expected amount. */
  async verifyCashfreeOrder(orderId: string, expectedAmount: number): Promise<boolean> {
    if (!orderId) return false;
    const cf = await this.cashfree();
    const resp = await fetch(`${cf.base}/orders/${encodeURIComponent(orderId)}`, { headers: cf.headers });
    const data: any = await resp.json().catch(() => ({}));
    if (!resp.ok || data.order_status !== 'PAID') return false;
    if (Math.abs(Number(data.order_amount) - Number(expectedAmount)) > 0.01) {
      this.logger.warn(`Cashfree amount mismatch for ${orderId}: got ${data.order_amount}, expected ${expectedAmount}`);
      return false;
    }
    return true;
  }

  /** Verify X-Razorpay-Signature on a webhook using the raw request body. */
  async verifyRazorpayWebhook(rawBody: Buffer | string | undefined, signature: string | undefined): Promise<boolean> {
    const secret = await this.settings.get('razorpay', 'webhook_secret');
    if (!secret) {
      this.logger.warn('Razorpay webhook secret is not set (Admin → Integrations) — rejecting webhook.');
      return false;
    }
    if (!rawBody || !signature) return false;
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    return this.safeEqual(expected, signature);
  }

  /** Verify Cashfree x-webhook-signature: base64(HMAC-SHA256(timestamp + rawBody, secret)). */
  async verifyCashfreeWebhook(rawBody: Buffer | string | undefined, signature: string | undefined, timestamp: string | undefined): Promise<boolean> {
    const secret = await this.settings.get('cashfree', 'secret_key');
    if (!secret || !rawBody || !signature || !timestamp) return false;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(timestamp + rawBody.toString())
      .digest('base64');
    return this.safeEqual(expected, signature);
  }

  private safeEqual(a: string, b: string): boolean {
    const ba = Buffer.from(String(a));
    const bb = Buffer.from(String(b));
    return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
  }

  /** Status to store once a payment succeeds. */
  paidSplitStatus(current: string | null | undefined): SplitStatus {
    return current === 'pending' ? 'scheduled' : ((current as SplitStatus) || 'manual');
  }

  invalidate(schoolId: number) {
    this.cache.delete(schoolId);
  }
}
