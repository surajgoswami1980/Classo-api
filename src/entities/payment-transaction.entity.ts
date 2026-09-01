import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('payment_transactions')
@Index('idx_school_status', ['school_id', 'status'])
@Index('idx_razorpay_order', ['razorpay_order_id'])
export class PaymentTransactionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column()
  fee_invoice_id: number;

  @Column()
  student_id: number;

  @Column({ nullable: true })
  parent_user_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: ['upi', 'credit_card', 'debit_card', 'net_banking', 'cash', 'cheque'] })
  payment_method: string;

  @Column({ type: 'enum', enum: ['razorpay', 'offline'], default: 'razorpay' })
  gateway: string;

  @Column({ length: 100, nullable: true })
  razorpay_order_id: string;

  @Column({ length: 100, nullable: true })
  razorpay_payment_id: string;

  @Column({ length: 255, nullable: true })
  razorpay_signature: string;

  @Column({ type: 'enum', enum: ['initiated', 'success', 'failed', 'refunded'], default: 'initiated' })
  status: string;

  @Column({ type: 'text', nullable: true })
  failure_reason: string;

  @Column({ length: 500, nullable: true })
  receipt_url: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  platform_commission: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
