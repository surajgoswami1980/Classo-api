import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, Unique } from 'typeorm';

@Entity('student_marks')
@Index('idx_school_exam', ['school_id', 'exam_id'])
@Unique('uk_student_exam_subject', ['student_id', 'exam_subject_id'])
export class StudentMarksEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column()
  exam_id: number;

  @Column()
  exam_subject_id: number;

  @Column()
  student_id: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  marks_obtained: number;

  @Column({ length: 5, nullable: true })
  grade: string;

  @Column({ length: 255, nullable: true })
  remarks: string;

  @Column()
  entered_by: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
