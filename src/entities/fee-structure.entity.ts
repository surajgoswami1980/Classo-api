import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('fee_structures')
@Index('idx_school_session_class', ['school_id', 'academic_session_id', 'class_id'])
export class FeeStructureEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column()
  academic_session_id: number;

  @Column({ length: 100 })
  name: string;

  @Column()
  class_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total_amount: number;

  @Column({ default: 1 })
  installment_count: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  late_fee_per_day: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  late_fee_max: number;

  @Column({ type: 'tinyint', default: 1 })
  is_active: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
