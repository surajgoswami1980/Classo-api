import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeeController } from './fee.controller';
import { FeeService } from './fee.service';
import { FeeStructureEntity } from '../../entities/fee-structure.entity';
import { FeeInvoiceEntity } from '../../entities/fee-invoice.entity';
import { PaymentTransactionEntity } from '../../entities/payment-transaction.entity';
import { StudentEntity } from '../../entities/student.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeeStructureEntity,
      FeeInvoiceEntity,
      PaymentTransactionEntity,
      StudentEntity,
    ]),
  ],
  controllers: [FeeController],
  providers: [FeeService],
  exports: [FeeService],
})
export class FeeModule {}
