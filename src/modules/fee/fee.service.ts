import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { FeeStructureEntity } from '../../entities/fee-structure.entity';
import { FeeInvoiceEntity } from '../../entities/fee-invoice.entity';
import { PaymentTransactionEntity } from '../../entities/payment-transaction.entity';
import { StudentEntity } from '../../entities/student.entity';
import { RedisService } from '../../common/providers/redis.service';
import { PaymentGatewayService } from '../../common/providers/payment-gateway.service';

@Injectable()
export class FeeService {
  constructor(
    @InjectRepository(FeeStructureEntity) private feeStructureRepo: Repository<FeeStructureEntity>,
    @InjectRepository(FeeInvoiceEntity) private invoiceRepo: Repository<FeeInvoiceEntity>,
    @InjectRepository(PaymentTransactionEntity) private txnRepo: Repository<PaymentTransactionEntity>,
    @InjectRepository(StudentEntity) private studentRepo: Repository<StudentEntity>,
    private configService: ConfigService,
    private redis: RedisService,
    private paymentGateway: PaymentGatewayService,
  ) {}

  // ─── Fee Structure ───────────────────────────────────────────

  /**
   * Create fee structure for a class
   */
  async createFeeStructure(schoolId: number, dto: CreateFeeStructureDto) {
    const structure = this.feeStructureRepo.create({
      school_id: schoolId,
      academic_session_id: dto.academic_session_id,
      name: dto.name,
      class_id: dto.class_id,
      total_amount: dto.total_amount,
      installment_count: dto.installment_count || 1,
      late_fee_per_day: dto.late_fee_per_day || 0,
      late_fee_max: dto.late_fee_max || 0,
    });
    return this.feeStructureRepo.save(structure);
  }

  /**
   * List fee structures for a school
   */
  async listFeeStructures(schoolId: number, classId?: number) {
    const where: any = { school_id: schoolId, is_active: 1 };
    if (classId) where.class_id = classId;
    return this.feeStructureRepo.find({ where, order: { created_at: 'DESC' } });
  }

  // ─── Invoices ────────────────────────────────────────────────

  /**
   * Generate invoices for all students in a class (based on fee structure)
   */
  async generateInvoices(schoolId: number, dto: GenerateInvoicesDto) {
    const structure = await this.feeStructureRepo.findOne({
      where: { id: dto.fee_structure_id, school_id: schoolId },
    });
    if (!structure) throw new NotFoundException('Fee structure not found');

    // Get all active students in the class
    const students = await this.studentRepo.find({
      where: { school_id: schoolId, class_id: structure.class_id, status: 'active' },
    });

    if (students.length === 0) {
      throw new BadRequestException('No active students found in this class');
    }

    const installmentAmount = Math.ceil((structure.total_amount / structure.installment_count) * 100) / 100;
    const invoices: FeeInvoiceEntity[] = [];

    for (const student of students) {
      // Check if invoice already exists for this student + installment
      const existing = await this.invoiceRepo.findOne({
        where: {
          school_id: schoolId,
          student_id: student.id,
          fee_structure_id: structure.id,
          fee_installment_id: dto.installment_number,
        },
      });

      if (existing) continue; // Skip already generated

      const invoiceNumber = this.generateInvoiceNumber(schoolId, student.id, dto.installment_number);

      const invoice = this.invoiceRepo.create({
        school_id: schoolId,
        student_id: student.id,
        fee_structure_id: structure.id,
        fee_installment_id: dto.installment_number,
        invoice_number: invoiceNumber,
        amount: installmentAmount,
        late_fee: 0,
        total_amount: installmentAmount,
        status: 'pending',
        due_date: dto.due_date,
      });

      invoices.push(await this.invoiceRepo.save(invoice));
    }

    return {
      message: `Generated ${invoices.length} invoices`,
      total_students: students.length,
      already_generated: students.length - invoices.length,
      new_invoices: invoices.length,
    };
  }

  /**
   * Get invoices for a student (parent/student portal view)
   */
  async getStudentInvoices(schoolId: number, studentId: number) {
    return this.invoiceRepo.find({
      where: { school_id: schoolId, student_id: studentId },
      order: { due_date: 'DESC' },
    });
  }

  /**
   * Get all invoices for admin (with filters)
   */
  async listInvoices(schoolId: number, filters: InvoiceFiltersDto) {
    const query = this.invoiceRepo.createQueryBuilder('i')
      .where('i.school_id = :schoolId', { schoolId });

    if (filters.status) query.andWhere('i.status = :status', { status: filters.status });
    if (filters.class_id) {
      query.andWhere('i.fee_structure_id IN (SELECT id FROM fee_structures WHERE class_id = :classId AND school_id = :schoolId)', { classId: filters.class_id, schoolId });
    }
    if (filters.student_id) query.andWhere('i.student_id = :studentId', { studentId: filters.student_id });

    query.orderBy('i.due_date', 'DESC');

    if (filters.page && filters.limit) {
      query.skip((filters.page - 1) * filters.limit).take(filters.limit);
    }

    const [data, total] = await query.getManyAndCount();
    return { data, total, page: filters.page || 1, limit: filters.limit || 20 };
  }

  // ─── Payment (Razorpay) ─────────────────────────────────────

  /**
   * Initiate payment — creates a Razorpay order
   */
  async initiatePayment(schoolId: number, dto: InitiatePaymentDto, userId: number) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: dto.invoice_id, school_id: schoolId },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    if (invoice.status === 'paid') {
      throw new BadRequestException('This invoice has already been paid');
    }

    // Calculate late fee if overdue
    const today = new Date();
    const dueDate = new Date(invoice.due_date);
    let lateFee = 0;

    if (today > dueDate) {
      const daysLate = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      // Get fee structure for late fee config
      const structure = await this.feeStructureRepo.findOne({
        where: { id: invoice.fee_structure_id },
      });
      if (structure && structure.late_fee_per_day > 0) {
        lateFee = Math.min(daysLate * Number(structure.late_fee_per_day), Number(structure.late_fee_max));
      }
    }

    const totalAmount = Number(invoice.amount) + lateFee;

    // Update invoice with late fee
    invoice.late_fee = lateFee;
    invoice.total_amount = totalAmount;
    await this.invoiceRepo.save(invoice);

    // Order on the platform gateway; school share is split via Route / Easy Split.
    // Receipt is unique per attempt so a retried payment never collides (Cashfree requires unique order ids).
    const order = await this.paymentGateway.createOrder(
      schoolId,
      totalAmount,
      `FEE-${schoolId}-${invoice.id}-${Date.now().toString(36)}`,
      {
        school_id: schoolId,
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number,
        student_id: invoice.student_id,
        user_id: userId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
      },
    );

    const txn = this.txnRepo.create({
      school_id: schoolId,
      fee_invoice_id: invoice.id,
      student_id: invoice.student_id,
      parent_user_id: userId,
      amount: totalAmount,
      payment_method: dto.payment_method || 'upi',
      gateway: order.provider,
      razorpay_order_id: order.order_id,
      status: 'initiated',
      platform_commission: order.platform_fee,
      gateway_fee: order.gateway_fee,
      school_share: order.school_share,
      split_status: order.split_status,
      split_account: order.split_account,
    });
    await this.txnRepo.save(txn);

    return {
      provider: order.provider,
      order_id: order.order_id,
      amount: totalAmount,
      currency: 'INR',
      invoice_number: invoice.invoice_number,
      razorpay_key: (order as any).key || null,
      payment_session_id: (order as any).payment_session_id || null,
      cashfree_env: (order as any).env || null,
      student_id: invoice.student_id,
      prefill: {
        name: dto.name || '',
        email: dto.email || '',
        contact: dto.phone || '',
      },
    };
  }

  /**
   * Verify payment after checkout — Razorpay (signature) or Cashfree (order status).
   */
  async verifyPayment(schoolId: number, dto: VerifyPaymentDto & { cashfree_order_id?: string }) {
    const orderId = dto.cashfree_order_id || dto.razorpay_order_id;
    if (!orderId) throw new BadRequestException('Order id is required');

    const txn = await this.txnRepo.findOne({ where: { razorpay_order_id: orderId, school_id: schoolId } });
    if (!txn) throw new NotFoundException('Transaction not found');
    if (txn.status === 'success') {
      return { message: 'Payment already verified', transaction_id: txn.id, amount: txn.amount, invoice_id: txn.fee_invoice_id };
    }

    let ok: boolean;
    if (txn.gateway === 'cashfree') {
      ok = await this.paymentGateway.verifyCashfreeOrder(orderId, Number(txn.amount));
    } else {
      ok = await this.paymentGateway.verifyRazorpaySignature(orderId, dto.razorpay_payment_id, dto.razorpay_signature);
    }

    if (!ok) {
      await this.txnRepo.update(
        { id: txn.id },
        { status: 'failed', failure_reason: txn.gateway === 'cashfree' ? 'Cashfree order not paid' : 'Signature verification failed' },
      );
      throw new BadRequestException('Payment verification failed');
    }

    if (txn.gateway !== 'cashfree') {
      txn.razorpay_payment_id = dto.razorpay_payment_id;
      txn.razorpay_signature = dto.razorpay_signature;
    }
    await this.markTxnPaid(txn);

    return { message: 'Payment successful', transaction_id: txn.id, amount: txn.amount, invoice_id: txn.fee_invoice_id };
  }

  /** Mark a transaction paid and settle whatever it pays for (fee invoice / event registration). */
  private async markTxnPaid(txn: PaymentTransactionEntity, method?: string) {
    if (txn.status === 'success') return;
    txn.status = 'success';
    txn.split_status = this.paymentGateway.paidSplitStatus(txn.split_status);
    if (method) txn.payment_method = method;
    await this.txnRepo.save(txn);

    if (txn.fee_invoice_id) {
      await this.invoiceRepo.update(
        { id: txn.fee_invoice_id, school_id: txn.school_id },
        { status: 'paid', paid_date: new Date() },
      );
    }
    if (txn.event_registration_id) {
      await this.txnRepo.query(
        `UPDATE event_registrations SET payment_status = 'paid', status = 'registered' WHERE id = ? AND school_id = ?`,
        [txn.event_registration_id, txn.school_id],
      );
    }
  }

  /** Mark a store order paid (webhook path) — mirrors StoreService.verifyPurchase. */
  private async markStoreOrderPaid(orderId: string, paymentId?: string) {
    const rows = await this.txnRepo.query(`SELECT * FROM store_orders WHERE razorpay_order_id = ? LIMIT 1`, [orderId]);
    const order = rows?.[0];
    if (!order || order.payment_status === 'paid') return;
    const invoiceNumber = order.invoice_number || `INV-STORE-${order.school_id}-${String(order.id).padStart(6, '0')}`;
    await this.txnRepo.query(
      `UPDATE store_orders
       SET payment_status = 'paid', status = 'purchased', razorpay_payment_id = COALESCE(?, razorpay_payment_id),
           invoice_number = ?, split_status = IF(split_status = 'pending', 'scheduled', split_status),
           paid_at = NOW(), invoiced_at = NOW(), updated_at = NOW()
       WHERE id = ? AND payment_status <> 'paid'`,
      [paymentId || null, invoiceNumber, order.id],
    );
    await this.txnRepo.query(
      `UPDATE store_items SET stock = GREATEST(stock - ?, 0) WHERE id = ? AND stock IS NOT NULL`,
      [order.quantity, order.store_item_id],
    );
  }

  /** Gateway method → our payment_method enum. */
  private mapMethod(method?: string): string | undefined {
    switch ((method || '').toLowerCase()) {
      case 'upi': return 'upi';
      case 'netbanking':
      case 'net_banking': return 'net_banking';
      case 'credit_card': return 'credit_card';
      case 'card':
      case 'debit_card': return 'debit_card';
      default: return undefined; // wallet / emi / paylater — keep the original value
    }
  }

  /** Sync an admin-created payment link (onboarding / setup) from a gateway webhook. */
  private async updatePaymentLink(gatewayLinkId: string, status: string, amountPaid: number, paymentId?: string) {
    const rows = await this.txnRepo.query(
      `SELECT id, enquiry_id, status FROM payment_links WHERE gateway_link_id = ? LIMIT 1`,
      [gatewayLinkId],
    );
    const link = rows?.[0];
    if (!link || link.status === 'paid') return; // unknown link, or already final
    await this.txnRepo.query(
      `UPDATE payment_links
       SET status = ?, amount_paid = ?, gateway_payment_id = COALESCE(?, gateway_payment_id),
           paid_at = IF(? = 'paid', COALESCE(paid_at, NOW()), paid_at), updated_at = NOW()
       WHERE id = ?`,
      [status, amountPaid, paymentId || null, status, link.id],
    );
    if (status === 'paid' && link.enquiry_id) {
      await this.txnRepo.query(`UPDATE enquiries SET status = 'converted', updated_at = NOW() WHERE id = ?`, [link.enquiry_id]);
    }
  }

  private async updateSplit(where: { payment_id?: string; order_id?: string }, status: 'processed' | 'failed', reference?: string) {
    const col = where.payment_id ? 'razorpay_payment_id' : 'razorpay_order_id';
    const val = where.payment_id || where.order_id;
    for (const table of ['payment_transactions', 'store_orders']) {
      await this.txnRepo.query(
        `UPDATE ${table} SET split_status = ?, split_reference = COALESCE(?, split_reference), updated_at = NOW() WHERE ${col} = ?`,
        [status, reference || null, val],
      );
    }
  }

  /**
   * Razorpay webhook — payments (fee, event, store) + Route transfer status.
   * The signature is checked against RAZORPAY_WEBHOOK_SECRET using the raw body.
   */
  async handleWebhook(payload: any, rawBody?: Buffer, signature?: string) {
    if (!(await this.paymentGateway.verifyRazorpayWebhook(rawBody, signature))) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const event: string = payload?.event;

    // Onboarding / setup payment links created from the admin panel
    if (event?.startsWith('payment_link.')) {
      const pl = payload.payload?.payment_link?.entity;
      const status = { 'payment_link.paid': 'paid', 'payment_link.partially_paid': 'partially_paid', 'payment_link.expired': 'expired', 'payment_link.cancelled': 'cancelled' }[event];
      if (pl?.id && status) {
        await this.updatePaymentLink(pl.id, status, Number(pl.amount_paid || 0) / 100, payload.payload?.payment?.entity?.id);
      }
      return { received: true };
    }

    // Route: school share transferred / failed
    if (event === 'transfer.processed' || event === 'transfer.failed') {
      const t = payload.payload?.transfer?.entity;
      if (t?.source) {
        await this.updateSplit({ payment_id: t.source }, event === 'transfer.processed' ? 'processed' : 'failed', t.id);
      }
      return { received: true };
    }

    const p = payload?.payload?.payment?.entity;
    if (!p?.order_id) return { received: true };

    if (event === 'payment.captured' || event === 'order.paid') {
      const txn = await this.txnRepo.findOne({ where: { razorpay_order_id: p.order_id } });
      if (txn) {
        if (Math.round(Number(txn.amount) * 100) !== Number(p.amount)) {
          return { received: true, ignored: 'amount_mismatch' };
        }
        txn.razorpay_payment_id = p.id;
        await this.markTxnPaid(txn, this.mapMethod(p.method));
      } else {
        await this.markStoreOrderPaid(p.order_id, p.id);
      }
    } else if (event === 'payment.failed') {
      await this.txnRepo.update(
        { razorpay_order_id: p.order_id, status: 'initiated' },
        { status: 'failed', failure_reason: p.error_description || 'Payment failed' },
      );
    }

    return { received: true };
  }

  /**
   * Cashfree webhook — payment success / failure for Easy Split orders.
   * Signature = base64(HMAC-SHA256(timestamp + rawBody, CASHFREE_SECRET_KEY)).
   */
  async handleCashfreeWebhook(payload: any, rawBody?: Buffer, signature?: string, timestamp?: string) {
    if (!(await this.paymentGateway.verifyCashfreeWebhook(rawBody, signature, timestamp))) {
      throw new BadRequestException('Invalid webhook signature');
    }

    const type: string = payload?.type || '';

    // Cashfree payment links (onboarding / setup) — link status events
    if (type === 'PAYMENT_LINK_EVENT') {
      const l = payload?.data;
      const status = { PAID: 'paid', PARTIALLY_PAID: 'partially_paid', EXPIRED: 'expired', CANCELLED: 'cancelled' }[String(l?.link_status)];
      if (l?.link_id && status) {
        await this.updatePaymentLink(String(l.link_id), status, Number(l.link_amount_paid || 0), l?.order?.transaction_id ? String(l.order.transaction_id) : undefined);
      }
      return { received: true };
    }

    const orderId: string = payload?.data?.order?.order_id;
    if (!orderId) return { received: true };

    if (type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const paidAmount = Number(payload?.data?.payment?.payment_amount ?? payload?.data?.order?.order_amount);
      const txn = await this.txnRepo.findOne({ where: { razorpay_order_id: orderId } });
      if (txn) {
        if (Math.abs(Number(txn.amount) - paidAmount) > 0.01) return { received: true, ignored: 'amount_mismatch' };
        await this.markTxnPaid(txn);
      } else {
        await this.markStoreOrderPaid(orderId, payload?.data?.payment?.cf_payment_id ? String(payload.data.payment.cf_payment_id) : undefined);
      }
    } else if (type === 'PAYMENT_FAILED_WEBHOOK' || type === 'PAYMENT_USER_DROPPED_WEBHOOK') {
      await this.txnRepo.update(
        { razorpay_order_id: orderId, status: 'initiated' },
        { status: 'failed', failure_reason: payload?.data?.payment?.payment_message || 'Payment failed' },
      );
    }

    return { received: true };
  }

  /**
   * Mark invoice as paid (offline payment by admin)
   */
  async markPaidOffline(schoolId: number, invoiceId: number, dto: OfflinePaymentDto, userId: number) {
    const invoice = await this.invoiceRepo.findOne({
      where: { id: invoiceId, school_id: schoolId },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');

    if (invoice.status === 'paid') {
      throw new BadRequestException('Invoice already paid');
    }

    // Create offline transaction
    const txn = this.txnRepo.create({
      school_id: schoolId,
      fee_invoice_id: invoice.id,
      student_id: invoice.student_id,
      parent_user_id: userId,
      amount: invoice.total_amount,
      payment_method: dto.payment_method, // cash, cheque
      gateway: 'offline',
      status: 'success',
      platform_commission: 0, // No commission on offline
    });
    await this.txnRepo.save(txn);

    // Update invoice
    invoice.status = 'paid';
    invoice.paid_date = new Date();
    await this.invoiceRepo.save(invoice);

    return { message: 'Payment recorded successfully', transaction_id: txn.id };
  }

  /**
   * Fee collection report
   */
  async getCollectionReport(schoolId: number, fromDate: string, toDate: string) {
    const result = await this.txnRepo.query(`
      SELECT 
        DATE(t.created_at) as date,
        COUNT(*) as total_transactions,
        SUM(CASE WHEN t.status = 'success' THEN t.amount ELSE 0 END) as collected,
        SUM(CASE WHEN t.status = 'failed' THEN 1 ELSE 0 END) as failed_count,
        SUM(CASE WHEN t.gateway <> 'offline' AND t.status = 'success' THEN t.amount ELSE 0 END) as online_collected,
        SUM(CASE WHEN t.gateway = 'offline' AND t.status = 'success' THEN t.amount ELSE 0 END) as offline_collected,
        SUM(CASE WHEN t.status = 'success' THEN t.platform_commission ELSE 0 END) as commission_earned
      FROM payment_transactions t
      WHERE t.school_id = ? AND t.created_at BETWEEN ? AND ?
      GROUP BY DATE(t.created_at)
      ORDER BY date DESC
    `, [schoolId, fromDate, toDate]);

    const totals = result.reduce((acc: any, r: any) => ({
      total_collected: acc.total_collected + Number(r.collected),
      online: acc.online + Number(r.online_collected),
      offline: acc.offline + Number(r.offline_collected),
      commission: acc.commission + Number(r.commission_earned),
    }), { total_collected: 0, online: 0, offline: 0, commission: 0 });

    return { daily: result, summary: totals };
  }

  /**
   * Get fee defaulters
   */
  async getDefaulters(schoolId: number) {
    const today = new Date().toISOString().split('T')[0];
    return this.invoiceRepo.query(`
      SELECT i.*, s.roll_number, u.name, u.phone,
             c.name as class_name, sec.name as section_name,
             DATEDIFF(CURDATE(), i.due_date) as days_overdue
      FROM fee_invoices i
      JOIN students s ON s.id = i.student_id
      JOIN users u ON u.id = s.user_id
      JOIN classes c ON c.id = s.class_id
      JOIN sections sec ON sec.id = s.section_id
      WHERE i.school_id = ? AND i.status IN ('pending', 'overdue') AND i.due_date < ?
      ORDER BY days_overdue DESC
    `, [schoolId, today]);
  }

  // ─── Helpers ─────────────────────────────────────────────────

  private generateInvoiceNumber(schoolId: number, studentId: number, installment: number): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    return `INV-${schoolId}-${studentId}-${installment}-${timestamp}`;
  }
}

// ─── DTOs ──────────────────────────────────────────────────────

export class CreateFeeStructureDto {
  academic_session_id: number;
  name: string;
  class_id: number;
  total_amount: number;
  installment_count?: number;
  late_fee_per_day?: number;
  late_fee_max?: number;
}

export class GenerateInvoicesDto {
  fee_structure_id: number;
  installment_number: number;
  due_date: string;
}

export class InitiatePaymentDto {
  invoice_id: number;
  payment_method?: string;
  name?: string;
  email?: string;
  phone?: string;
}

export class VerifyPaymentDto {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
  cashfree_order_id?: string;
}

export class OfflinePaymentDto {
  payment_method: 'cash' | 'cheque';
  reference_number?: string;
  remarks?: string;
}

export class InvoiceFiltersDto {
  status?: string;
  class_id?: number;
  student_id?: number;
  page?: number;
  limit?: number;
}
