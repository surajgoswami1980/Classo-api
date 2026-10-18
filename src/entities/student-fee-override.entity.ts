import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('student_fee_overrides')
@Index('uniq_student_fee_override', ['school_id', 'student_id', 'fee_category_id'], { unique: true })
export class StudentFeeOverrideEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column()
  student_id: number;

  @Column()
  fee_category_id: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 255, nullable: true })
  reason: string;

  @Column({ nullable: true })
  updated_by: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
