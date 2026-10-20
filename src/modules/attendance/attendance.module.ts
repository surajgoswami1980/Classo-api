import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceController } from './attendance.controller';
import { IclockController } from './iclock.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceConfigService } from './attendance-config.service';
import { HolidayService } from './holiday.service';
import { SelfAttendanceService } from './self-attendance.service';
import { FaceMatchService } from './face-match.service';
import { BiometricService } from './biometric.service';
import { StudentAttendanceEntity } from '../../entities/student-attendance.entity';
import { StaffAttendanceEntity } from '../../entities/staff-attendance.entity';
import { StudentEntity } from '../../entities/student.entity';
import { UserEntity } from '../../entities/user.entity';
import { HolidayEntity } from '../../entities/holiday.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentAttendanceEntity,
      StaffAttendanceEntity,
      StudentEntity,
      UserEntity,
      HolidayEntity,
    ]),
  ],
  controllers: [AttendanceController, IclockController],
  providers: [
    AttendanceService,
    AttendanceConfigService,
    HolidayService,
    SelfAttendanceService,
    FaceMatchService,
    BiometricService,
  ],
  exports: [AttendanceService, HolidayService, AttendanceConfigService],
})
export class AttendanceModule {}
