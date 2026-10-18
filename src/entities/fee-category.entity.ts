import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('fee_categories')
@Index('idx_fee_cat_school', ['school_id', 'is_active'])
export class FeeCategoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column({ length: 120 })
  name: string;

  @Column({ type: 'enum', enum: ['monthly', 'one_time', 'exam'], default: 'monthly' })
  type: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ default: 0 })
  sort_order: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
