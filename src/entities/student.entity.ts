import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('students')
@Index('idx_school_class', ['school_id', 'class_id'])
@Index('idx_school_section', ['school_id', 'section_id'])
@Index('idx_school_status', ['school_id', 'status'])
export class StudentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column()
  user_id: number;

  @Column({ length: 50, nullable: true })
  admission_number: string;

  @Column()
  class_id: number;

  @Column()
  section_id: number;

  @Column({ length: 20, nullable: true })
  roll_number: string;

  @Column({ type: 'date', nullable: true })
  date_of_birth: Date;

  @Column({ type: 'enum', enum: ['male', 'female', 'other'], nullable: true })
  gender: string;

  @Column({ length: 5, nullable: true })
  blood_group: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ length: 100, nullable: true })
  state: string;

  @Column({ length: 10, nullable: true })
  pincode: string;

  @Column({ type: 'date', nullable: true })
  admission_date: Date;

  @Column({ type: 'enum', enum: ['active', 'inactive', 'transferred', 'graduated'], default: 'active' })
  status: string;

  @Column({ length: 255, nullable: true })
  previous_school: string;

  @Column({ nullable: true })
  transport_route_id: number;

  @Column({ length: 255, nullable: true })
  father_name: string;

  @Column({ length: 15, nullable: true })
  father_phone: string;

  @Column({ length: 255, nullable: true })
  mother_name: string;

  @Column({ length: 15, nullable: true })
  mother_phone: string;

  @Column({ length: 255, nullable: true })
  guardian_name: string;

  @Column({ length: 15, nullable: true })
  guardian_phone: string;

  @Column({ type: 'text', nullable: true })
  medical_conditions: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => UserEntity)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
