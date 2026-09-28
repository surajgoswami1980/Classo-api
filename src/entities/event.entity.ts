import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('events')
@Index('idx_school_status', ['school_id', 'status'])
@Index('idx_school_start', ['school_id', 'start_at'])
export class EventEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 50, default: 'general' })
  category: string;

  @Column({ length: 255, nullable: true })
  venue: string;

  @Column({ length: 500, nullable: true })
  banner: string;

  @Column({ type: 'datetime' })
  start_at: Date;

  @Column({ type: 'datetime', nullable: true })
  end_at: Date;

  @Column({ type: 'datetime', nullable: true })
  registration_deadline: Date;

  @Column({ type: 'boolean', default: false })
  is_paid: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fee: number;

  @Column({ nullable: true })
  capacity: number;

  @Column({ type: 'enum', enum: ['all', 'class', 'section'], default: 'all' })
  audience_type: string;

  @Column({ nullable: true })
  class_id: number;

  @Column({ nullable: true })
  section_id: number;

  @Column({ type: 'enum', enum: ['draft', 'published', 'cancelled', 'completed'], default: 'draft' })
  status: string;

  @Column({ nullable: true })
  created_by: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
