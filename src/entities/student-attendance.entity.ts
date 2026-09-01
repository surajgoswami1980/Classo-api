import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

@Entity('student_attendance')
@Index('idx_school_class_date', ['school_id', 'class_id', 'date'])
@Index('idx_student_date_range', ['school_id', 'student_id', 'date'])
@Unique('uk_student_date', ['student_id', 'date'])
export class StudentAttendanceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column()
  student_id: number;

  @Column()
  class_id: number;

  @Column()
  section_id: number;

  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'enum', enum: ['present', 'absent', 'late', 'half_day'] })
  status: string;

  @Column()
  marked_by: number; // user_id of teacher/admin

  @Column({ length: 255, nullable: true })
  remarks: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
