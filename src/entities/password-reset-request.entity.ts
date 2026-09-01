import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('password_reset_requests')
@Index('idx_user_expiry', ['user_id', 'expires_at'])
export class PasswordResetRequestEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  user_id: number;

  @Column({ length: 64 })
  token_hash: string;

  @Column({ type: 'timestamp' })
  expires_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  used_at: Date;

  @CreateDateColumn()
  created_at: Date;
}
