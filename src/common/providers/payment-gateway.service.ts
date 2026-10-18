import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';

const Razorpay = require('razorpay');
const crypto = require('crypto');

export interface ResolvedGateway {
  provider: 'razorpay' | 'cashfree';
  // Razorpay
  keyId?: string;
  keySecret?: string;
  // Cashfree
  cashfreeAppId?: string;
  cashfreeSecret?: string;
  cashfreeEnv?: 'TEST' | 'PROD';
  // true when these are the school's own keys (not the platform default)
  isSchoolOwned: boolean;
}

/**
 * Resolves which payment gateway + credentials to use for a given school,
 * so collected money routes to the SCHOOL's own account (client-wise).
 *
 * Priority:
 *  1. The school's active_gateway in payment_settings (its own keys).
 *  2. Fallback to the PLATFORM Razorpay keys from .env (demo / subscription).
 *
 * The platform keys are also used directly (via platformRazorpay) for
 * subscription billing — schools paying the platform.
 */
@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);
  private cache = new Map<number, { gw: ResolvedGateway; at: number }>();
  private clients = new Map<string, any>();

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  /** Platform-level Razorpay (global .env keys) — used for subscription billing. */
  platformRazorpay() {
    const keyId = this.config.get('RAZORPAY_KEY_ID');
    const keySecret = this.config.get('RAZORPAY_KEY_SECRET');
    if (!keyId || !keySecret) {
      throw new BadRequestException('Platform Razorpay keys are not configured in the API .env.');
    }
    return this.razorpayClient(keyId, keySecret);
  }

  platformKeyId(): string {
    return this.config.get('RAZORPAY_KEY_ID');
  }

  private razorpayClient(keyId: string, keySecret: string) {
    const k = `${keyId}`;
    if (!this.clients.has(k)) {
      this.clients.set(k, new Razorpay({ key_id: keyId, key_secret: keySecret }));
    }
    return this.clients.get(k);
  }

  /** Resolve the gateway config for a school (cached 60s). */
  async resolveForSchool(schoolId: number): Promise<ResolvedGateway> {
    const cached = this.cache.get(schoolId);
    if (cached && Date.now() - cached.at < 60_000) return cached.gw;

    let gw: ResolvedGateway;
    const rows = await this.dataSource.query(
      `SELECT * FROM payment_settings WHERE school_id = ? LIMIT 1`,
      [schoolId],
    );
    const s = rows?.[0];

    if (s && s.active_gateway === 'razorpay' && s.razorpay_enabled && s.razorpay_key_id && s.razorpay_key_secret) {
      gw = { provider: 'razorpay', keyId: s.razorpay_key_id, keySecret: s.razorpay_key_secret, isSchoolOwned: true };
    } else if (s && s.active_gateway === 'cashfree' && s.cashfree_enabled && s.cashfree_app_id && s.cashfree_secret_key) {
      gw = {
        provider: 'cashfree',
        cashfreeAppId: s.cashfree_app_id,
        cashfreeSecret: s.cashfree_secret_key,
        cashfreeEnv: s.cashfree_env || 'TEST',
        isSchoolOwned: true,
      };
    } else {
      // Fallback: platform Razorpay (demo / school hasn't set up its own gateway).
      const keyId = this.config.get('RAZORPAY_KEY_ID');
      const keySecret = this.config.get('RAZORPAY_KEY_SECRET');
      if (!keyId || !keySecret) {
        throw new BadRequestException('No payment gateway configured for this school and no platform default is set.');
      }
      gw = { provider: 'razorpay', keyId, keySecret, isSchoolOwned: false };
    }

    this.cache.set(schoolId, { gw, at: Date.now() });
    return gw;
  }

  /** Create an order on the school's resolved gateway. Returns a normalized shape. */
  async createOrder(schoolId: number, amountRupees: number, receipt: string, notes: Record<string, any> = {}) {
    const gw = await this.resolveForSchool(schoolId);

    if (gw.provider === 'razorpay') {
      const client = this.razorpayClient(gw.keyId, gw.keySecret);
      const order = await client.orders.create({
        amount: Math.round(amountRupees * 100),
        currency: 'INR',
        receipt,
        notes,
      });
      return {
        provider: 'razorpay' as const,
        order_id: order.id,
        key: gw.keyId,
        amount: amountRupees,
        currency: 'INR',
      };
    }

    // Cashfree — create an order via their orders API.
    const base = gw.cashfreeEnv === 'PROD' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
    const resp = await fetch(`${base}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-version': '2023-08-01',
        'x-client-id': gw.cashfreeAppId,
        'x-client-secret': gw.cashfreeSecret,
      },
      body: JSON.stringify({
        order_id: receipt,
        order_amount: Number(amountRupees.toFixed(2)),
        order_currency: 'INR',
        customer_details: {
          customer_id: `u${notes.user_id || 'guest'}`,
          customer_phone: notes.phone || '9999999999',
          customer_email: notes.email || 'student@example.com',
          customer_name: notes.name || 'Student',
        },
      }),
    });
    const data: any = await resp.json();
    if (!resp.ok || !data.payment_session_id) {
      this.logger.error(`Cashfree order failed: ${JSON.stringify(data)}`);
      throw new BadRequestException(data.message || 'Cashfree order creation failed.');
    }
    return {
      provider: 'cashfree' as const,
      order_id: data.order_id || receipt,
      payment_session_id: data.payment_session_id,
      env: gw.cashfreeEnv,
      amount: amountRupees,
      currency: 'INR',
    };
  }

  /** Verify a Razorpay signature using the school's own secret. */
  async verifyRazorpaySignature(schoolId: number, orderId: string, paymentId: string, signature: string): Promise<boolean> {
    const gw = await this.resolveForSchool(schoolId);
    const secret = gw.provider === 'razorpay' ? gw.keySecret : this.config.get('RAZORPAY_KEY_SECRET');
    const expected = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');
    return expected === signature;
  }

  /** Verify a Cashfree payment by fetching the order status. */
  async verifyCashfreeOrder(schoolId: number, orderId: string): Promise<boolean> {
    const gw = await this.resolveForSchool(schoolId);
    if (gw.provider !== 'cashfree') return false;
    const base = gw.cashfreeEnv === 'PROD' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
    const resp = await fetch(`${base}/orders/${orderId}`, {
      headers: {
        'x-api-version': '2023-08-01',
        'x-client-id': gw.cashfreeAppId,
        'x-client-secret': gw.cashfreeSecret,
      },
    });
    const data: any = await resp.json();
    return resp.ok && data.order_status === 'PAID';
  }

  invalidate(schoolId: number) {
    this.cache.delete(schoolId);
  }
}
