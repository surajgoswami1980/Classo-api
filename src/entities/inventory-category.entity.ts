import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

@Entity('inventory_categories')
@Index('idx_school', ['school_id'])
export class InventoryCategoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column({ length: 100 })
  name: string;

  @CreateDateColumn()
  created_at: Date;
}
