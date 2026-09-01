"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvoiceFiltersDto = exports.OfflinePaymentDto = exports.VerifyPaymentDto = exports.InitiatePaymentDto = exports.GenerateInvoicesDto = exports.CreateFeeStructureDto = exports.FeeService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const config_1 = require("@nestjs/config");
const fee_structure_entity_1 = require("../../entities/fee-structure.entity");
const fee_invoice_entity_1 = require("../../entities/fee-invoice.entity");
const payment_transaction_entity_1 = require("../../entities/payment-transaction.entity");
const student_entity_1 = require("../../entities/student.entity");
const redis_service_1 = require("../../common/providers/redis.service");
const Razorpay = require('razorpay');
let FeeService = class FeeService {
    constructor(feeStructureRepo, invoiceRepo, txnRepo, studentRepo, configService, redis) {
        this.feeStructureRepo = feeStructureRepo;
        this.invoiceRepo = invoiceRepo;
        this.txnRepo = txnRepo;
        this.studentRepo = studentRepo;
        this.configService = configService;
        this.redis = redis;
    }
    getRazorpay() {
        if (!this.razorpay) {
            const keyId = this.configService.get('RAZORPAY_KEY_ID');
            const keySecret = this.configService.get('RAZORPAY_KEY_SECRET');
            if (!keyId || !keySecret) {
                throw new common_1.BadRequestException('Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env');
            }
            this.razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
        }
        return this.razorpay;
    }
    async createFeeStructure(schoolId, dto) {
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
    async listFeeStructures(schoolId, classId) {
        const where = { school_id: schoolId, is_active: 1 };
        if (classId)
            where.class_id = classId;
        return this.feeStructureRepo.find({ where, order: { created_at: 'DESC' } });
    }
    async generateInvoices(schoolId, dto) {
        const structure = await this.feeStructureRepo.findOne({
            where: { id: dto.fee_structure_id, school_id: schoolId },
        });
        if (!structure)
            throw new common_1.NotFoundException('Fee structure not found');
        const students = await this.studentRepo.find({
            where: { school_id: schoolId, class_id: structure.class_id, status: 'active' },
        });
        if (students.length === 0) {
            throw new common_1.BadRequestException('No active students found in this class');
        }
        const installmentAmount = Math.ceil((structure.total_amount / structure.installment_count) * 100) / 100;
        const invoices = [];
        for (const student of students) {
            const existing = await this.invoiceRepo.findOne({
                where: {
                    school_id: schoolId,
                    student_id: student.id,
                    fee_structure_id: structure.id,
                    fee_installment_id: dto.installment_number,
                },
            });
            if (existing)
                continue;
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
    async getStudentInvoices(schoolId, studentId) {
        return this.invoiceRepo.find({
            where: { school_id: schoolId, student_id: studentId },
            order: { due_date: 'DESC' },
        });
    }
    async listInvoices(schoolId, filters) {
        const query = this.invoiceRepo.createQueryBuilder('i')
            .where('i.school_id = :schoolId', { schoolId });
        if (filters.status)
            query.andWhere('i.status = :status', { status: filters.status });
        if (filters.class_id) {
            query.andWhere('i.fee_structure_id IN (SELECT id FROM fee_structures WHERE class_id = :classId AND school_id = :schoolId)', { classId: filters.class_id, schoolId });
        }
        if (filters.student_id)
            query.andWhere('i.student_id = :studentId', { studentId: filters.student_id });
        query.orderBy('i.due_date', 'DESC');
        if (filters.page && filters.limit) {
            query.skip((filters.page - 1) * filters.limit).take(filters.limit);
        }
        const [data, total] = await query.getManyAndCount();
        return { data, total, page: filters.page || 1, limit: filters.limit || 20 };
    }
    async initiatePayment(schoolId, dto, userId) {
        const invoice = await this.invoiceRepo.findOne({
            where: { id: dto.invoice_id, school_id: schoolId },
        });
        if (!invoice)
            throw new common_1.NotFoundException('Invoice not found');
        if (invoice.status === 'paid') {
            throw new common_1.BadRequestException('This invoice has already been paid');
        }
        const today = new Date();
        const dueDate = new Date(invoice.due_date);
        let lateFee = 0;
        if (today > dueDate) {
            const daysLate = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            const structure = await this.feeStructureRepo.findOne({
                where: { id: invoice.fee_structure_id },
            });
            if (structure && structure.late_fee_per_day > 0) {
                lateFee = Math.min(daysLate * Number(structure.late_fee_per_day), Number(structure.late_fee_max));
            }
        }
        const totalAmount = Number(invoice.amount) + lateFee;
        invoice.late_fee = lateFee;
        invoice.total_amount = totalAmount;
        await this.invoiceRepo.save(invoice);
        const order = await this.getRazorpay().orders.create({
            amount: Math.round(totalAmount * 100),
            currency: 'INR',
            receipt: invoice.invoice_number,
            notes: {
                school_id: schoolId.toString(),
                invoice_id: invoice.id.toString(),
                student_id: invoice.student_id.toString(),
            },
        });
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
            platform_commission: Math.round(totalAmount * 0.015 * 100) / 100,
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
    async verifyPayment(schoolId, dto) {
        const crypto = require('crypto');
        const body = dto.razorpay_order_id + '|' + dto.razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', this.configService.get('RAZORPAY_KEY_SECRET'))
            .update(body)
            .digest('hex');
        if (expectedSignature !== dto.razorpay_signature) {
            await this.txnRepo.update({ razorpay_order_id: dto.razorpay_order_id, school_id: schoolId }, { status: 'failed', failure_reason: 'Signature verification failed' });
            throw new common_1.BadRequestException('Payment verification failed');
        }
        const txn = await this.txnRepo.findOne({
            where: { razorpay_order_id: dto.razorpay_order_id, school_id: schoolId },
        });
        if (!txn)
            throw new common_1.NotFoundException('Transaction not found');
        if (txn.status === 'success') {
            return { message: 'Payment already verified', transaction_id: txn.id };
        }
        txn.razorpay_payment_id = dto.razorpay_payment_id;
        txn.razorpay_signature = dto.razorpay_signature;
        txn.status = 'success';
        await this.txnRepo.save(txn);
        await this.invoiceRepo.update({ id: txn.fee_invoice_id, school_id: schoolId }, { status: 'paid', paid_date: new Date() });
        return {
            message: 'Payment successful',
            transaction_id: txn.id,
            amount: txn.amount,
            invoice_id: txn.fee_invoice_id,
        };
    }
    async handleWebhook(payload) {
        const event = payload.event;
        const paymentEntity = payload.payload?.payment?.entity;
        if (!paymentEntity)
            return { received: true };
        const orderId = paymentEntity.order_id;
        const txn = await this.txnRepo.findOne({ where: { razorpay_order_id: orderId } });
        if (!txn)
            return { received: true };
        if (event === 'payment.captured' && txn.status !== 'success') {
            txn.razorpay_payment_id = paymentEntity.id;
            txn.status = 'success';
            txn.payment_method = paymentEntity.method || txn.payment_method;
            await this.txnRepo.save(txn);
            await this.invoiceRepo.update({ id: txn.fee_invoice_id }, { status: 'paid', paid_date: new Date() });
        }
        else if (event === 'payment.failed' && txn.status === 'initiated') {
            txn.status = 'failed';
            txn.failure_reason = paymentEntity.error_description || 'Payment failed';
            await this.txnRepo.save(txn);
        }
        return { received: true };
    }
    async markPaidOffline(schoolId, invoiceId, dto, userId) {
        const invoice = await this.invoiceRepo.findOne({
            where: { id: invoiceId, school_id: schoolId },
        });
        if (!invoice)
            throw new common_1.NotFoundException('Invoice not found');
        if (invoice.status === 'paid') {
            throw new common_1.BadRequestException('Invoice already paid');
        }
        const txn = this.txnRepo.create({
            school_id: schoolId,
            fee_invoice_id: invoice.id,
            student_id: invoice.student_id,
            parent_user_id: userId,
            amount: invoice.total_amount,
            payment_method: dto.payment_method,
            gateway: 'offline',
            status: 'success',
            platform_commission: 0,
        });
        await this.txnRepo.save(txn);
        invoice.status = 'paid';
        invoice.paid_date = new Date();
        await this.invoiceRepo.save(invoice);
        return { message: 'Payment recorded successfully', transaction_id: txn.id };
    }
    async getCollectionReport(schoolId, fromDate, toDate) {
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
        const totals = result.reduce((acc, r) => ({
            total_collected: acc.total_collected + Number(r.collected),
            online: acc.online + Number(r.online_collected),
            offline: acc.offline + Number(r.offline_collected),
            commission: acc.commission + Number(r.commission_earned),
        }), { total_collected: 0, online: 0, offline: 0, commission: 0 });
        return { daily: result, summary: totals };
    }
    async getDefaulters(schoolId) {
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
    generateInvoiceNumber(schoolId, studentId, installment) {
        const timestamp = Date.now().toString(36).toUpperCase();
        return `INV-${schoolId}-${studentId}-${installment}-${timestamp}`;
    }
};
exports.FeeService = FeeService;
exports.FeeService = FeeService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(fee_structure_entity_1.FeeStructureEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(fee_invoice_entity_1.FeeInvoiceEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(payment_transaction_entity_1.PaymentTransactionEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(student_entity_1.StudentEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService,
        redis_service_1.RedisService])
], FeeService);
class CreateFeeStructureDto {
}
exports.CreateFeeStructureDto = CreateFeeStructureDto;
class GenerateInvoicesDto {
}
exports.GenerateInvoicesDto = GenerateInvoicesDto;
class InitiatePaymentDto {
}
exports.InitiatePaymentDto = InitiatePaymentDto;
class VerifyPaymentDto {
}
exports.VerifyPaymentDto = VerifyPaymentDto;
class OfflinePaymentDto {
}
exports.OfflinePaymentDto = OfflinePaymentDto;
class InvoiceFiltersDto {
}
exports.InvoiceFiltersDto = InvoiceFiltersDto;
//# sourceMappingURL=fee.service.js.map