import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('hostel_rooms')
@Index('idx_school_block', ['school_id', 'block_id'])
export class HostelRoomEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column()
  block_id: number;

  @Column({ length: 30 })
  room_number: string;

  @Column({ type: 'enum', enum: ['single', 'double', 'triple', 'dormitory'], default: 'double' })
  room_type: string;

  @Column({ default: 2 })
  capacity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fee_per_month: number;

  @Column({ type: 'tinyint', default: 1 })
  is_active: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
