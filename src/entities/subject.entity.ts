import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('subjects')
@Index('idx_school_class', ['school_id', 'class_id'])
export class SubjectEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ length: 20, nullable: true })
  code: string;

  @Column()
  class_id: number;

  @Column({ type: 'enum', enum: ['core', 'elective', 'activity'], default: 'core' })
  type: string;

  @CreateDateColumn()
  created_at: Date;
}
