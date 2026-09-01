import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('timetable_periods')
@Index('idx_school_class_day', ['school_id', 'class_id', 'section_id', 'day_of_week'])
@Index('idx_school_teacher_day', ['school_id', 'teacher_id', 'day_of_week'])
export class TimetablePeriodEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column()
  academic_session_id: number;

  @Column()
  class_id: number;

  @Column()
  section_id: number;

  @Column()
  subject_id: number;

  @Column()
  teacher_id: number;

  @Column({ type: 'enum', enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] })
  day_of_week: string;

  @Column({ type: 'time' })
  start_time: string;

  @Column({ type: 'time' })
  end_time: string;

  @Column()
  period_number: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
