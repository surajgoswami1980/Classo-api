import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('hostel_allocations')
@Index('idx_school_room', ['school_id', 'room_id'])
@Index('idx_school_student', ['school_id', 'student_id'])
export class HostelAllocationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column()
  room_id: number;

  @Column()
  student_id: number;

  @Column({ type: 'date' })
  allocated_from: Date;

  @Column({ type: 'date', nullable: true })
  vacated_on: Date;

  @Column({ type: 'enum', enum: ['active', 'vacated'], default: 'active' })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
