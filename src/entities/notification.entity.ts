import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('notifications')
@Index('idx_school_status', ['school_id', 'status'])
export class NotificationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text' })
  body: string;

  @Column({ type: 'enum', enum: ['push', 'email', 'sms', 'all'], default: 'all' })
  channel: string;

  @Column({ type: 'enum', enum: ['all', 'role', 'class', 'section', 'individual'] })
  target_type: string;

  @Column({ type: 'enum', enum: ['teacher', 'student', 'parent', 'staff'], nullable: true })
  target_role: string;

  @Column({ nullable: true })
  target_class_id: number;

  @Column({ nullable: true })
  target_section_id: number;

  @Column({ type: 'json', nullable: true })
  target_user_ids: number[];

  @Column()
  sent_by: number;

  @Column({ type: 'enum', enum: ['queued', 'processing', 'sent', 'failed'], default: 'queued' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  sent_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
