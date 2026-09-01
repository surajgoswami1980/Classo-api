import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('assignments')
@Index('idx_school_class', ['school_id', 'class_id', 'section_id'])
@Index('idx_school_teacher', ['school_id', 'teacher_id'])
export class AssignmentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column()
  teacher_id: number;

  @Column()
  class_id: number;

  @Column()
  section_id: number;

  @Column()
  subject_id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date' })
  due_date: Date;

  @Column({ length: 500, nullable: true })
  attachment_url: string;

  @Column({ length: 50, nullable: true })
  attachment_type: string;

  @Column({ type: 'enum', enum: ['draft', 'published'], default: 'published' })
  status: string;

  @Column({ type: 'int', default: 100 })
  max_marks: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
