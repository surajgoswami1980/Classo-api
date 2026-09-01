import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchoolController } from './school.controller';
import { SchoolService } from './school.service';
import { ClassEntity } from '../../entities/class.entity';
import { SectionEntity } from '../../entities/section.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ClassEntity, SectionEntity])],
  controllers: [SchoolController],
  providers: [SchoolService],
  exports: [SchoolService],
})
export class SchoolModule {}
