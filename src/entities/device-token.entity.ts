import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('device_tokens')
@Index('idx_token_user_active', ['user_id', 'is_active'])
export class DeviceTokenEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  school_id: number;

  @Column()
  user_id: number;

  @Column({ length: 512 })
  token: string;

  @Column({ length: 20, default: 'android' })
  platform: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'timestamp', nullable: true })
  last_used_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
