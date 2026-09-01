import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('sections')
@Index('idx_school_class', ['school_id', 'class_id'])
export class SectionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column()
  class_id: number;

  @Column({ length: 10 })
  name: string; // "A", "B", "C"

  @Column({ default: 40 })
  capacity: number;

  @Column({ nullable: true })
  class_teacher_id: number; // user_id of assigned teacher

  @CreateDateColumn()
  created_at: Date;
}
