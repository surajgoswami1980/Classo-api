import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('transport_stops')
@Index('idx_route', ['school_id', 'route_id'])
export class TransportStopEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column()
  route_id: number;

  @Column({ length: 100 })
  name: string;

  @Column()
  sequence_order: number;

  @Column({ type: 'time', nullable: true })
  pickup_time: string;

  @Column({ type: 'time', nullable: true })
  drop_time: string;

  @CreateDateColumn()
  created_at: Date;
}
