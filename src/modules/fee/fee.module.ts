import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeeController } from './fee.controller';
import { FeeService } from './fee.service';
import { FeeCategoryController } from './fee-category.controller';
import { FeeCategoryService } from './fee-category.service';
import { FeeStructureEntity } from '../../entities/fee-structure.entity';
import { FeeInvoiceEntity } from '../../entities/fee-invoice.entity';
import { PaymentTransactionEntity } from '../../entities/payment-transaction.entity';
import { StudentEntity } from '../../entities/student.entity';
import { FeeCategoryEntity } from '../../entities/fee-category.entity';
import { ClassFeePlanEntity } from '../../entities/class-fee-plan.entity';
import { StudentFeeOverrideEntity } from '../../entities/student-fee-override.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      FeeStructureEntity,
      FeeInvoiceEntity,
      PaymentTransactionEntity,
      StudentEntity,
      FeeCategoryEntity,
      ClassFeePlanEntity,
      StudentFeeOverrideEntity,
    ]),
  ],
  controllers: [FeeController, FeeCategoryController],
  providers: [FeeService, FeeCategoryService],
  exports: [FeeService, FeeCategoryService],
})
export class FeeModule {}
