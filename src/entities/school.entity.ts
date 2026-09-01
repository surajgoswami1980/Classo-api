import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('schools')
export class SchoolEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 50, unique: true })
  code: string;

  @Column({ length: 255, nullable: true })
  email: string;

  @Column({ length: 255, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ length: 100, nullable: true })
  state: string;

  @Column({ length: 10, nullable: true })
  pincode: string;

  @Column({ length: 255, nullable: true })
  logo: string;

  @Column({ length: 255, nullable: true })
  website: string;

  @Column({ length: 50, nullable: true })
  board_affiliation: string;

  @Column({ length: 50, nullable: true })
  subscription_plan: string;

  @Column({ type: 'date', nullable: true })
  subscription_start: Date;

  @Column({ type: 'date', nullable: true })
  subscription_end: Date;

  @Column({ nullable: true })
  max_students: number;

  @Column({ type: 'json', nullable: true })
  settings: Record<string, any>;

  @Column({ type: 'boolean', default: true })
  @Index()
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
