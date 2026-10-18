import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('class_fee_plans')
@Index('idx_class_fee_plan_class', ['school_id', 'class_id'])
export class ClassFeePlanEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column()
  fee_category_id: number;

  @Column()
  class_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'tinyint', unsigned: true, default: 10 })
  due_day: number;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
