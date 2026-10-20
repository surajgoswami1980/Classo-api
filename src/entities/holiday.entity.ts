import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('holidays')
@Index('idx_school_range', ['school_id', 'start_date', 'end_date'])
export class HolidayEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column({ length: 150 })
  title: string;

  @Column({ length: 500, nullable: true })
  description: string;

  @Column({ type: 'date' })
  start_date: string;

  @Column({ type: 'date' })
  end_date: string;

  @Column({ length: 20, default: 'holiday' })
  type: string; // holiday | vacation | exam_break | other

  @Column({ length: 10, default: 'all' })
  applies_to: string; // all | students | staff

  @Column({ nullable: true })
  created_by: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
