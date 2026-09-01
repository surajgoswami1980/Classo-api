import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TimetableController } from './timetable.controller';
import { TimetableService } from './timetable.service';
import { TimetablePeriodEntity } from '../../entities/timetable-period.entity';
import { StudentEntity } from '../../entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TimetablePeriodEntity, StudentEntity])],
  controllers: [TimetableController],
  providers: [TimetableService],
  exports: [TimetableService],
})
export class TimetableModule {}
