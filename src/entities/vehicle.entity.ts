import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('vehicles')
@Index('idx_school', ['school_id'])
export class VehicleEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column({ length: 20 })
  vehicle_number: string;

  @Column()
  capacity: number;

  @Column({ type: 'enum', enum: ['bus', 'van', 'auto'], default: 'bus' })
  vehicle_type: string;

  @Column({ length: 100, nullable: true })
  driver_name: string;

  @Column({ length: 15, nullable: true })
  driver_phone: string;

  @Column({ length: 100, nullable: true })
  conductor_name: string;

  @Column({ length: 15, nullable: true })
  conductor_phone: string;

  @Column({ type: 'date', nullable: true })
  insurance_expiry: Date;

  @Column({ type: 'date', nullable: true })
  fitness_expiry: Date;

  @Column({ type: 'tinyint', default: 1 })
  is_active: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
