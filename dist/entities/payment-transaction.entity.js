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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentTransactionEntity = void 0;
const typeorm_1 = require("typeorm");
let PaymentTransactionEntity = class PaymentTransactionEntity {
};
exports.PaymentTransactionEntity = PaymentTransactionEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PaymentTransactionEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PaymentTransactionEntity.prototype, "school_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PaymentTransactionEntity.prototype, "fee_invoice_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PaymentTransactionEntity.prototype, "student_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], PaymentTransactionEntity.prototype, "parent_user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2 }),
    __metadata("design:type", Number)
], PaymentTransactionEntity.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['upi', 'credit_card', 'debit_card', 'net_banking', 'cash', 'cheque'] }),
    __metadata("design:type", String)
], PaymentTransactionEntity.prototype, "payment_method", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['razorpay', 'offline'], default: 'razorpay' }),
    __metadata("design:type", String)
], PaymentTransactionEntity.prototype, "gateway", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], PaymentTransactionEntity.prototype, "razorpay_order_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, nullable: true }),
    __metadata("design:type", String)
], PaymentTransactionEntity.prototype, "razorpay_payment_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], PaymentTransactionEntity.prototype, "razorpay_signature", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['initiated', 'success', 'failed', 'refunded'], default: 'initiated' }),
    __metadata("design:type", String)
], PaymentTransactionEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], PaymentTransactionEntity.prototype, "failure_reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, nullable: true }),
    __metadata("design:type", String)
], PaymentTransactionEntity.prototype, "receipt_url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], PaymentTransactionEntity.prototype, "platform_commission", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PaymentTransactionEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PaymentTransactionEntity.prototype, "updated_at", void 0);
exports.PaymentTransactionEntity = PaymentTransactionEntity = __decorate([
    (0, typeorm_1.Entity)('payment_transactions'),
    (0, typeorm_1.Index)('idx_school_status', ['school_id', 'status']),
    (0, typeorm_1.Index)('idx_razorpay_order', ['razorpay_order_id'])
], PaymentTransactionEntity);
//# sourceMappingURL=payment-transaction.entity.js.map