import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExamController } from './exam.controller';
import { ExamService } from './exam.service';
import { ReportCardPdfService } from '../report/report-card-pdf.service';
import { ExamEntity } from '../../entities/exam.entity';
import { StudentMarksEntity } from '../../entities/student-marks.entity';
import { StudentEntity } from '../../entities/student.entity';
import { SubjectEntity } from '../../entities/subject.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExamEntity,
      StudentMarksEntity,
      StudentEntity,
      SubjectEntity,
    ]),
  ],
  controllers: [ExamController],
  providers: [ExamService, ReportCardPdfService],
  exports: [ExamService],
})
export class ExamModule {}
