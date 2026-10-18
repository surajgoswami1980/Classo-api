import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { StudentEntity } from '../../entities/student.entity';

import { PaymentGatewayService } from '../../common/providers/payment-gateway.service';

const Razorpay = require('razorpay');

/**
 * Student-facing store: browse active items, purchase (pay online via
 * Razorpay). An order is created as pending_payment, then flips to
 * "purchased" (paid, awaiting collection) on verify. The school marks it
 * "completed" from the admin when the student collects the item.
 */
@Injectable()
export class StoreService {
  constructor(
    @InjectRepository(StudentEntity) private studentRepo: Repository<StudentEntity>,
    private config: ConfigService,
    private paymentGateway: PaymentGatewayService,
  ) {}

  private db() {
    // Reuse the StudentEntity's connection for raw queries across store tables.
    return this.studentRepo;
  }

  private assetUrl(path?: string | null): string | null {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const base = (this.config.get('ADMIN_PUBLIC_URL') || 'http://localhost:8000').replace(/\/$/, '');
    return `${base}/storage/${path}`;
  }

  /** List active store items for the school. */
  async listItems(schoolId: number) {
    const rows = await this.db().query(
      `SELECT id, name, description, category, image, price, stock, sort_order
       FROM store_items
       WHERE school_id = ? AND is_active = 1
       ORDER BY sort_order ASC, id DESC`,
      [schoolId],
    );
    return rows.map((r: any) => ({
      ...r,
      price: Number(r.price),
      image_url: this.assetUrl(r.image),
      in_stock: r.stock === null || r.stock > 0,
    }));
  }

  /** A student's own orders. */
  async myOrders(schoolId: number, userId: number) {
    const rows = await this.db().query(
      `SELECT o.*, i.image AS item_image
       FROM store_orders o
       LEFT JOIN store_items i ON i.id = o.store_item_id
       WHERE o.school_id = ? AND o.user_id = ?
       ORDER BY o.created_at DESC`,
      [schoolId, userId],
    );
    return rows.map((o: any) => ({
      ...o,
      total_amount: Number(o.total_amount),
      unit_price: Number(o.unit_price),
      image_url: this.assetUrl(o.item_image),
      has_invoice: o.payment_status === 'paid',
    }));
  }

  private async resolveStudentId(schoolId: number, userId: number): Promise<number | null> {
    const rows = await this.db().query(
      `SELECT id FROM students WHERE user_id = ? AND school_id = ? LIMIT 1`,
      [userId, schoolId],
    );
    return rows?.length ? rows[0].id : null;
  }

  /**
   * Initiate a purchase: creates a pending order + a Razorpay order.
   */
  async purchase(schoolId: number, userId: number, itemId: number, quantity = 1, prefill: any = {}) {
    const items = await this.db().query(
      `SELECT * FROM store_items WHERE id = ? AND school_id = ? AND is_active = 1 LIMIT 1`,
      [itemId, schoolId],
    );
    if (!items.length) throw new NotFoundException('Item not found or unavailable');
    const item = items[0];

    const qty = Math.max(1, Number(quantity) || 1);
    if (item.stock !== null && item.stock < qty) {
      throw new BadRequestException('Not enough stock available');
    }

    const unitPrice = Number(item.price);
    const total = Math.round(unitPrice * qty * 100) / 100;
    const studentId = await this.resolveStudentId(schoolId, userId);
    const orderNumber = `STORE-${schoolId}-${Date.now().toString(36).toUpperCase()}`;

    // Create the order on the SCHOOL's resolved gateway (client-wise routing).
    const gwOrder = await this.paymentGateway.createOrder(schoolId, total, orderNumber, {
      school_id: schoolId, store_item_id: itemId, user_id: userId,
      name: prefill?.name, email: prefill?.email, phone: prefill?.contact || prefill?.phone,
    });

    await this.db().query(
      `INSERT INTO store_orders
        (school_id, store_item_id, user_id, student_id, order_number, item_name, quantity,
         unit_price, total_amount, status, payment_status, gateway, razorpay_order_id, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?,'pending_payment','pending',?,?,NOW(),NOW())`,
      [schoolId, itemId, userId, studentId, orderNumber, item.name, qty, unitPrice, total, gwOrder.provider, gwOrder.order_id],
    );

    return {
      provider: gwOrder.provider,
      order_id: gwOrder.order_id,
      order_number: orderNumber,
      amount: total,
      currency: 'INR',
      razorpay_key: (gwOrder as any).key || null,
      payment_session_id: (gwOrder as any).payment_session_id || null,
      cashfree_env: (gwOrder as any).env || null,
      item: { id: item.id, name: item.name, price: unitPrice },
      prefill,
    };
  }

  /**
   * Verify payment signature → flip order to "purchased" (paid, awaiting
   * collection) and decrement stock.
   */
  async verifyPurchase(schoolId: number, dto: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) {
    const orders = await this.db().query(
      `SELECT * FROM store_orders WHERE razorpay_order_id = ? AND school_id = ? LIMIT 1`,
      [dto.razorpay_order_id, schoolId],
    );
    if (!orders.length) throw new NotFoundException('Order not found');
    const order = orders[0];

    const ok = await this.paymentGateway.verifyRazorpaySignature(
      schoolId, dto.razorpay_order_id, dto.razorpay_payment_id, dto.razorpay_signature,
    );

    if (!ok) {
      await this.db().query(
        `UPDATE store_orders SET payment_status = 'failed', updated_at = NOW() WHERE id = ?`,
        [order.id],
      );
      throw new BadRequestException('Payment verification failed');
    }

    if (order.payment_status === 'paid') {
      return {
        message: 'Already verified',
        order_number: order.order_number,
        invoice_number: order.invoice_number,
      };
    }

    // Generate a stable, customer-facing invoice number the moment payment is
    // confirmed. Format: INV-STORE-{schoolId}-{orderId zero-padded}.
    const invoiceNumber =
      order.invoice_number || `INV-STORE-${schoolId}-${String(order.id).padStart(6, '0')}`;

    await this.db().query(
      `UPDATE store_orders
       SET payment_status = 'paid', status = 'purchased', razorpay_payment_id = ?,
           invoice_number = ?, paid_at = NOW(), invoiced_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [dto.razorpay_payment_id, invoiceNumber, order.id],
    );

    // Decrement stock if tracked.
    await this.db().query(
      `UPDATE store_items SET stock = GREATEST(stock - ?, 0) WHERE id = ? AND stock IS NOT NULL`,
      [order.quantity, order.store_item_id],
    );

    return {
      message: 'Purchase successful',
      order_number: order.order_number,
      invoice_number: invoiceNumber,
      status: 'purchased',
    };
  }

  /** Admin: all store orders for the school, optional status filter. */
  async adminListOrders(schoolId: number, status?: string) {
    const rows = await this.db().query(
      `SELECT o.*, u.name AS buyer_name, u.phone AS buyer_phone, i.image AS item_image
       FROM store_orders o
       LEFT JOIN users u ON u.id = o.user_id
       LEFT JOIN store_items i ON i.id = o.store_item_id
       WHERE o.school_id = ? ${status ? 'AND o.status = ?' : ''}
       ORDER BY o.created_at DESC
       LIMIT 200`,
      status ? [schoolId, status] : [schoolId],
    );
    return rows.map((o: any) => ({
      ...o,
      total_amount: Number(o.total_amount),
      unit_price: Number(o.unit_price),
      image_url: this.assetUrl(o.item_image),
    }));
  }

  /** Admin: mark a paid order as collected/completed. */
  async adminMarkCollected(schoolId: number, orderId: number) {
    const rows = await this.db().query(
      `SELECT * FROM store_orders WHERE id = ? AND school_id = ? LIMIT 1`,
      [orderId, schoolId],
    );
    if (!rows.length) throw new NotFoundException('Order not found');
    if (rows[0].status !== 'purchased') {
      throw new BadRequestException('Only paid (purchased) orders can be marked collected');
    }
    await this.db().query(
      `UPDATE store_orders SET status = 'completed', completed_at = NOW(), updated_at = NOW() WHERE id = ?`,
      [orderId],
    );
    return { message: 'Order marked as collected', order_id: orderId, status: 'completed' };
  }

  /**
   * Build the invoice payload for a paid store order. Only the owning user
   * (or, from admin, any order in the school) may fetch it. Returns null when
   * the order is missing, not paid, or not owned by the requester.
   */
  async getInvoiceData(schoolId: number, orderId: number, userId?: number) {
    const rows = await this.db().query(
      `SELECT o.*, u.name AS buyer_name, u.email AS buyer_email, u.phone AS buyer_phone,
              s.roll_number AS roll_number, c.name AS class_name
       FROM store_orders o
       LEFT JOIN users u ON u.id = o.user_id
       LEFT JOIN students s ON s.id = o.student_id
       LEFT JOIN classes c ON c.id = s.class_id
       WHERE o.id = ? AND o.school_id = ? LIMIT 1`,
      [orderId, schoolId],
    );
    if (!rows.length) return null;
    const o = rows[0];

    // Ownership check for student/parent callers (admin passes no userId).
    if (userId != null && Number(o.user_id) !== Number(userId)) return null;
    if (o.payment_status !== 'paid') return null;

    const school = await this.db().query(
      `SELECT name, logo, address, city, state, pincode, phone, email, settings
       FROM schools WHERE id = ? LIMIT 1`,
      [schoolId],
    );
    const sc = school[0] || {};
    let settings: any = {};
    try {
      settings = sc.settings ? (typeof sc.settings === 'string' ? JSON.parse(sc.settings) : sc.settings) : {};
    } catch {
      settings = {};
    }
    const addressParts = [sc.address, sc.city, sc.state, sc.pincode].filter(
      (p: any) => p && String(p).trim().length > 0,
    );

    return {
      invoice_number: o.invoice_number || `INV-STORE-${schoolId}-${String(o.id).padStart(6, '0')}`,
      order_number: o.order_number,
      issued_at: o.invoiced_at || o.paid_at || o.created_at,
      payment_status: o.payment_status,
      status: o.status,
      razorpay_payment_id: o.razorpay_payment_id,
      razorpay_order_id: o.razorpay_order_id,
      item_name: o.item_name,
      quantity: Number(o.quantity),
      unit_price: Number(o.unit_price),
      total_amount: Number(o.total_amount),
      buyer: {
        name: o.buyer_name,
        email: o.buyer_email,
        phone: o.buyer_phone,
        class_name: o.class_name,
        roll_number: o.roll_number,
      },
      school: {
        name: sc.name || 'School',
        logo_url: this.assetUrl(sc.logo),
        address: addressParts.join(', '),
        phone: sc.phone,
        email: sc.email,
        primary_color: settings.primary_color || '#2563eb',
      },
    };
  }
}
