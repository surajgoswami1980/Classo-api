import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('hostel_blocks')
@Index('idx_school', ['school_id'])
export class HostelBlockEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ type: 'enum', enum: ['boys', 'girls', 'mixed'], default: 'boys' })
  type: string;

  @Column({ length: 100, nullable: true })
  warden_name: string;

  @Column({ length: 15, nullable: true })
  warden_phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'tinyint', default: 1 })
  is_active: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
