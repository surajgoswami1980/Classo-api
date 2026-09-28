import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('salary_structures')
@Index('idx_school_user', ['school_id', 'user_id'])
export class SalaryStructureEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column()
  user_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  basic: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  hra: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  allowances: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deductions: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  gross: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  net: number;

  @Column({ type: 'tinyint', default: 1 })
  is_active: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
