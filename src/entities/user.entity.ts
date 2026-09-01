import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, nullable: true })
  @Index()
  email: string;

  @Column({ length: 255 })
  password: string;

  @Column({ length: 15, nullable: true })
  phone: string;

  @Column({ length: 500, nullable: true })
  avatar: string;

  @Column({ nullable: true })
  @Index()
  school_id: number;

  @Column({ length: 50, nullable: true })
  employee_id: string;

  @Column({ length: 100, nullable: true })
  designation: string;

  @Column({ length: 100, nullable: true })
  department: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'boolean', default: false })
  is_class_incharge: boolean;

  @Column({ nullable: true })
  incharge_class_id: number;

  @Column({ nullable: true })
  incharge_section_id: number;

  @Column({ type: 'timestamp', nullable: true })
  last_login_at: Date;

  @Column({ length: 45, nullable: true })
  last_login_ip: string;

  @Column({ type: 'timestamp', nullable: true })
  deleted_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
