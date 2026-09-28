import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('event_registrations')
@Index('idx_school_event', ['school_id', 'event_id'])
export class EventRegistrationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column()
  event_id: number;

  @Column({ nullable: true })
  student_id: number;

  @Column()
  user_id: number;

  @Column({ type: 'enum', enum: ['not_required', 'pending', 'paid', 'failed'], default: 'not_required' })
  payment_status: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  amount: number;

  @Column({ nullable: true })
  payment_transaction_id: number;

  @Column({ type: 'enum', enum: ['registered', 'cancelled', 'attended'], default: 'registered' })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
