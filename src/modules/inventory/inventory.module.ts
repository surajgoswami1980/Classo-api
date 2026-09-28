import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { InventoryCategoryEntity } from '../../entities/inventory-category.entity';
import { InventoryItemEntity } from '../../entities/inventory-item.entity';
import { InventoryTransactionEntity } from '../../entities/inventory-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryCategoryEntity,
      InventoryItemEntity,
      InventoryTransactionEntity,
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}
