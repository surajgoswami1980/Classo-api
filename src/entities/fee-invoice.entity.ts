import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('fee_invoices')
@Index('idx_school_student', ['school_id', 'student_id'])
@Index('idx_school_status', ['school_id', 'status'])
@Index('idx_due_date', ['school_id', 'due_date'])
export class FeeInvoiceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column()
  student_id: number;

  @Column()
  fee_structure_id: number;

  @Column()
  fee_installment_id: number;

  @Column({ length: 50, unique: true })
  invoice_number: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  late_fee: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @Column({ type: 'enum', enum: ['pending', 'paid', 'overdue', 'partial'], default: 'pending' })
  status: string;

  @Column({ type: 'date' })
  due_date: Date;

  @Column({ type: 'date', nullable: true })
  paid_date: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
