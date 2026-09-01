import { Entity, PrimaryGeneratedColumn, Column, Index, Unique } from 'typeorm';

@Entity('notification_reads')
@Index('idx_school_user', ['school_id', 'user_id'])
@Unique('uk_notification_user', ['notification_id', 'user_id'])
export class NotificationReadEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column()
  notification_id: number;

  @Column()
  user_id: number;

  @Column({ type: 'timestamp' })
  read_at: Date;
}
