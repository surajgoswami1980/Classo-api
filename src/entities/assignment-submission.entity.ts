import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('assignment_submissions')
@Index('idx_sub_assignment', ['school_id', 'assignment_id'])
@Index('idx_sub_student', ['student_id'])
export class AssignmentSubmissionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column()
  assignment_id: number;

  @Column()
  student_id: number;

  @Column({ nullable: true })
  user_id: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 600, nullable: true })
  attachment_url: string;

  @Column({ length: 30, nullable: true })
  attachment_type: string;

  @Column({ type: 'enum', enum: ['pending', 'submitted', 'graded', 'missed'], default: 'pending' })
  status: string;

  @Column({ type: 'timestamp', nullable: true })
  submitted_at: Date;

  @Column({ type: 'boolean', default: false })
  is_late: boolean;

  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true })
  marks: number;

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @Column({ nullable: true })
  graded_by: number;

  @Column({ type: 'timestamp', nullable: true })
  graded_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
