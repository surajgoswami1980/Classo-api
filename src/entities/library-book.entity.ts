import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('library_books')
@Index('idx_school', ['school_id'])
export class LibraryBookEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ length: 255, nullable: true })
  author: string;

  @Column({ length: 20, nullable: true })
  isbn: string;

  @Column({ length: 100, nullable: true })
  category: string;

  @Column({ length: 255, nullable: true })
  publisher: string;

  @Column({ default: 1 })
  total_copies: number;

  @Column({ default: 1 })
  available_copies: number;

  @Column({ length: 50, nullable: true })
  rack_location: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
