import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

@Entity('staff_attendance')
@Index('idx_school_date', ['school_id', 'date'])
@Unique('uk_staff_date', ['user_id', 'date'])
export class StaffAttendanceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column()
  user_id: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'timestamp', nullable: true })
  check_in_time: Date;

  @Column({ type: 'timestamp', nullable: true })
  check_out_time: Date;

  @Column({ type: 'enum', enum: ['present', 'absent', 'leave', 'half_day', 'late'] })
  status: string;

  @Column({ nullable: true })
  marked_by: number;

  @Column({ length: 255, nullable: true })
  remarks: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
