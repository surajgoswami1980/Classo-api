import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('transport_routes')
@Index('idx_school', ['school_id'])
export class TransportRouteEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column({ length: 100 })
  name: string;

  @Column({ nullable: true })
  vehicle_id: number;

  @Column({ length: 100, nullable: true })
  driver_name: string;

  @Column({ length: 15, nullable: true })
  driver_phone: string;

  @Column({ type: 'tinyint', default: 1 })
  is_active: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
