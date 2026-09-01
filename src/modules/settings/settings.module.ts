import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { SchoolEntity } from '../../entities/school.entity';
import { AcademicSessionEntity } from '../../entities/academic-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SchoolEntity, AcademicSessionEntity])],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
