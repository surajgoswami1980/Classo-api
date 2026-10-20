import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

const decimal = { from: (v: string | null) => (v === null ? null : Number(v)), to: (v: number | null) => v };

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

  /** manual | app | geo | face | face_geo | biometric */
  @Column({ length: 20, default: 'manual' })
  method: string;

  @Column({ type: 'smallint', unsigned: true, nullable: true })
  late_minutes: number;

  @Column({ type: 'boolean', default: false })
  early_leave: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true, transformer: decimal })
  check_in_lat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true, transformer: decimal })
  check_in_lng: number;

  @Column({ type: 'smallint', unsigned: true, nullable: true })
  check_in_accuracy: number;

  @Column({ type: 'int', unsigned: true, nullable: true })
  check_in_distance: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true, transformer: decimal })
  check_out_lat: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true, transformer: decimal })
  check_out_lng: number;

  @Column({ type: 'int', unsigned: true, nullable: true })
  check_out_distance: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true, transformer: decimal })
  face_score: number;

  @Column({ length: 100, nullable: true })
  device_id: string;

  @Column({ length: 60, nullable: true })
  biometric_device_sn: string;

  @Column({ nullable: true })
  marked_by: number;

  @Column({ length: 255, nullable: true })
  remarks: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
