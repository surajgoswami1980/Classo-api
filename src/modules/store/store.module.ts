import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreController } from './store.controller';
import { StoreService } from './store.service';
import { StoreInvoiceService } from './store-invoice.service';
import { StudentEntity } from '../../entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StudentEntity])],
  controllers: [StoreController],
  providers: [StoreService, StoreInvoiceService],
})
export class StoreModule {}
