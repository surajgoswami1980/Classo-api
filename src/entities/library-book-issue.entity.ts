import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('library_book_issues')
@Index('idx_school_book', ['school_id', 'book_id'])
@Index('idx_school_status', ['school_id', 'status'])
export class LibraryBookIssueEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column()
  book_id: number;

  @Column()
  issued_to_user_id: number;

  @Column({ type: 'date' })
  issue_date: Date;

  @Column({ type: 'date' })
  due_date: Date;

  @Column({ type: 'date', nullable: true })
  return_date: Date;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0 })
  fine_amount: number;

  @Column({ type: 'tinyint', default: 0 })
  fine_paid: number;

  @Column({ type: 'enum', enum: ['issued', 'returned', 'overdue'], default: 'issued' })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
