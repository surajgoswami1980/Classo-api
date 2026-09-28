import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('inventory_items')
@Index('idx_school_category', ['school_id', 'category_id'])
export class InventoryItemEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  school_id: number;

  @Column({ nullable: true })
  category_id: number;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 50, nullable: true })
  sku: string;

  @Column({ length: 20, default: 'pcs' })
  unit: string;

  @Column({ default: 0 })
  quantity: number;

  @Column({ default: 0 })
  reorder_level: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  unit_price: number;

  @Column({ length: 100, nullable: true })
  location: string;

  @Column({ type: 'tinyint', default: 1 })
  is_active: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
