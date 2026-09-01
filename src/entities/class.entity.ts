import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('classes')
@Index('idx_school_session', ['school_id', 'academic_session_id'])
export class ClassEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column()
  academic_session_id: number;

  @Column({ length: 50 })
  name: string; // "Class 1", "Class 12", "Nursery", etc.

  @Column({ default: 0 })
  numeric_order: number; // For sorting

  @CreateDateColumn()
  created_at: Date;
}
