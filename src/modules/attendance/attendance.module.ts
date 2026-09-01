import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { StudentAttendanceEntity } from '../../entities/student-attendance.entity';
import { StaffAttendanceEntity } from '../../entities/staff-attendance.entity';
import { StudentEntity } from '../../entities/student.entity';
import { UserEntity } from '../../entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      StudentAttendanceEntity,
      StaffAttendanceEntity,
      StudentEntity,
      UserEntity,
    ]),
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
