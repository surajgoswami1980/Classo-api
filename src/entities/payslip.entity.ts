import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('payslips')
@Index('idx_school_period', ['school_id', 'year', 'month'])
export class PayslipEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column()
  user_id: number;

  @Column({ type: 'tinyint' })
  month: number;

  @Column({ type: 'smallint' })
  year: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  basic: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  hra: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  allowances: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deductions: number;

  @Column({ default: 0 })
  lop_days: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  gross: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  net: number;

  @Column({ type: 'enum', enum: ['generated', 'paid'], default: 'generated' })
  status: string;

  @Column({ type: 'date', nullable: true })
  paid_on: Date;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
