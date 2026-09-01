import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('teachers')
@Index('idx_school_status', ['school_id', 'status'])
export class TeacherEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column()
  user_id: number;

  @Column({ type: 'text', nullable: true })
  qualifications: string;

  @Column({ type: 'date', nullable: true })
  date_of_joining: Date;

  @Column({ length: 100, nullable: true })
  designation: string;

  @Column({ length: 100, nullable: true })
  department: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salary: number;

  @Column({ type: 'enum', enum: ['active', 'inactive', 'resigned'], default: 'active' })
  status: string;

  @Column({ type: 'date', nullable: true })
  date_of_leaving: Date;

  @Column({ type: 'json', nullable: true })
  assigned_classes: number[]; // class_ids

  @Column({ type: 'json', nullable: true })
  assigned_subjects: number[]; // subject_ids

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
