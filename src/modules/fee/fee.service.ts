import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThan } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { FeeStructureEntity } from '../../entities/fee-structure.entity';
import { FeeInvoiceEntity } from '../../entities/fee-invoice.entity';
import { PaymentTransactionEntity } from '../../entities/payment-transaction.entity';
import { StudentEntity } from '../../entities/student.entity';
import { RedisService } from '../../common/providers/redis.service';

const Razorpay = require('razorpay');

@Injectable()
export class FeeService {
  private razorpay: any;

  constructor(
    @InjectRepository(FeeStructureEntity) private feeStructureRepo: Repository<FeeStructureEntity>,
    @InjectRepository(FeeInvoiceEntity) private invoiceRepo: Repository<FeeInvoiceEntity>,
    @InjectRepository(PaymentTransactionEntity) private txnRepo: Repository<PaymentTransactionEntity>,
    @InjectRepository(StudentEntity) private studentRepo: Repository<StudentEntity>,
    private configService: ConfigService,
    private redis: RedisService,
  ) {}

  private getRazorpay() {
    if (!this.razorpay) {
      const keyId = this.configService.get('RAZORPAY_KEY_ID');
      const keySecret = this.configService.get('RAZORPAY_KEY_SECRET');
      if (!keyId || !keySecret) {
        throw new BadRequestException('Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env');
      }
      this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    }
    return this.razorpay;
  }

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

    // Create Razorpay order
    const order = await this.getRazorpay().orders.create({
      amount: Math.round(totalAmount * 100), // Razorpay uses paise
      currency: 'INR',
      receipt: invoice.invoice_number,
      notes: {
        school_id: schoolId.toString(),
        invoice_id: invoice.id.toString(),
        student_id: invoice.student_id.toString(),
      },
    });

    // Create transaction record
    const txn = this.txnRepo.create({
      school_id: schoolId,
      fee_invoice_id: invoice.id,
      student_id: invoice.student_id,
      parent_user_id: userId,
      amount: totalAmount,
      payment_method: dto.payment_method || 'upi',
      gateway: 'razorpay',
      razorpay_order_id: order.id,
      status: 'initiated',
      platform_commission: Math.round(totalAmount * 0.015 * 100) / 100, // 1.5% commission
    });
    await this.txnRepo.save(txn);

    return {
      order_id: order.id,
      amount: totalAmount,
      currency: 'INR',
      invoice_number: invoice.invoice_number,
      razorpay_key: this.configService.get('RAZORPAY_KEY_ID'),
      student_id: invoice.student_id,
      prefill: {
        name: dto.name || '',
        email: dto.email || '',
        contact: dto.phone || '',
      },
    };
  }

  /**
   * Verify payment — called after Razorpay payment completion
   */
  async verifyPayment(schoolId: number, dto: VerifyPaymentDto) {
    const crypto = require('crypto');

    // Verify Razorpay signature
    const body = dto.razorpay_order_id + '|' + dto.razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', this.configService.get('RAZORPAY_KEY_SECRET'))
      .update(body)
      .digest('hex');

    if (expectedSignature !== dto.razorpay_signature) {
      // Mark transaction as failed
      await this.txnRepo.update(
        { razorpay_order_id: dto.razorpay_order_id, school_id: schoolId },
        { status: 'failed', failure_reason: 'Signature verification failed' },
      );
      throw new BadRequestException('Payment verification failed');
    }

    // Update transaction
    const txn = await this.txnRepo.findOne({
      where: { razorpay_order_id: dto.razorpay_order_id, school_id: schoolId },
    });

    if (!txn) throw new NotFoundException('Transaction not found');
    if (txn.status === 'success') {
      return { message: 'Payment already verified', transaction_id: txn.id };
    }

    txn.razorpay_payment_id = dto.razorpay_payment_id;
    txn.razorpay_signature = dto.razorpay_signature;
    txn.status = 'success';
    await this.txnRepo.save(txn);

    // Update invoice status to paid
    await this.invoiceRepo.update(
      { id: txn.fee_invoice_id, school_id: schoolId },
      { status: 'paid', paid_date: new Date() },
    );

    return {
      message: 'Payment successful',
      transaction_id: txn.id,
      amount: txn.amount,
      invoice_id: txn.fee_invoice_id,
    };
  }

  /**
   * Razorpay webhook handler
   */
  async handleWebhook(payload: any) {
    const event = payload.event;
    const paymentEntity = payload.payload?.payment?.entity;

    if (!paymentEntity) return { received: true };

    const orderId = paymentEntity.order_id;
    const txn = await this.txnRepo.findOne({ where: { razorpay_order_id: orderId } });
    if (!txn) return { received: true };

    if (event === 'payment.captured' && txn.status !== 'success') {
      txn.razorpay_payment_id = paymentEntity.id;
      txn.status = 'success';
      txn.payment_method = paymentEntity.method || txn.payment_method;
      await this.txnRepo.save(txn);

      await this.invoiceRepo.update(
        { id: txn.fee_invoice_id },
        { status: 'paid', paid_date: new Date() },
      );
    } else if (event === 'payment.failed' && txn.status === 'initiated') {
      txn.status = 'failed';
      txn.failure_reason = paymentEntity.error_description || 'Payment failed';
      await this.txnRepo.save(txn);
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
        SUM(CASE WHEN t.gateway = 'razorpay' AND t.status = 'success' THEN t.amount ELSE 0 END) as online_collected,
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
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
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
