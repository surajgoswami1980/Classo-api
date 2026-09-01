import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('student_transport')
@Index('idx_school_route', ['school_id', 'route_id'])
export class StudentTransportEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column()
  student_id: number;

  @Column()
  route_id: number;

  @Column()
  stop_id: number;

  @Column()
  academic_session_id: number;

  @CreateDateColumn()
  created_at: Date;
}
