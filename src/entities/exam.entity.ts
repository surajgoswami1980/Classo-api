import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('exams')
@Index('idx_school_session', ['school_id', 'academic_session_id'])
export class ExamEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column()
  academic_session_id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'enum', enum: ['unit_test', 'mid_term', 'final', 'quarterly', 'half_yearly'] })
  exam_type: string;

  @Column({ type: 'date', nullable: true })
  start_date: Date;

  @Column({ type: 'date', nullable: true })
  end_date: Date;

  @Column({ type: 'tinyint', default: 0 })
  is_published: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
