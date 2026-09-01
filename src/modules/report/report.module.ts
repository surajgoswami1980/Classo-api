import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportController } from './report.controller';
import { ReportService } from './report.service';
import { StudentEntity } from '../../entities/student.entity';
import { ExamEntity } from '../../entities/exam.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StudentEntity, ExamEntity])],
  controllers: [ReportController],
  providers: [ReportService],
  exports: [ReportService],
})
export class ReportModule {}
