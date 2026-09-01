import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AttendanceService } from './attendance.service';
import { MarkStudentAttendanceDto, MarkStaffAttendanceDto, AttendanceReportDto } from './dto/attendance.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { RequirePermissions, Permission } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SchoolId } from '../../common/decorators/school-id.decorator';

@ApiTags('Attendance')
@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  // ─── Student Attendance ─────────────────────────────────

  @Post('student/mark')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.TEACHER, UserRole.INCHARGE)
  @RequirePermissions(Permission.ATTENDANCE_MARK)
  @ApiOperation({ summary: 'Mark student attendance for a class (bulk)' })
  async markStudentAttendance(
    @SchoolId() schoolId: number,
    @CurrentUser('user_id') userId: number,
    @Body() dto: MarkStudentAttendanceDto,
  ) {
    const result = await this.attendanceService.markStudentAttendance(schoolId, dto, userId);
    return { success: true, data: result };
  }

  @Get('student/get')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.TEACHER, UserRole.INCHARGE)
  @RequirePermissions(Permission.ATTENDANCE_VIEW)
  @ApiOperation({ summary: 'Get student attendance for a class/date' })
  async getStudentAttendance(
    @SchoolId() schoolId: number,
    @Query('class_id') classId: number,
    @Query('section_id') sectionId: number,
    @Query('date') date: string,
  ) {
    const result = await this.attendanceService.getStudentAttendance(schoolId, classId, sectionId, date);
    return { success: true, data: result };
  }

  @Get('student/monthly')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.TEACHER, UserRole.INCHARGE, UserRole.STUDENT, UserRole.PARENT)
  @ApiOperation({ summary: 'Get student monthly attendance (calendar view)' })
  async getStudentMonthlyAttendance(
    @SchoolId() schoolId: number,
    @CurrentUser('user_id') userId: number,
    @Query('month') month: number,
    @Query('year') year: number,
    @Query('student_id') studentId?: number,
  ) {
    const result = await this.attendanceService.getStudentMonthlyAttendance(
      schoolId, userId, month, year, studentId,
    );
    return { success: true, data: result };
  }

  @Post('student/report')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.TEACHER, UserRole.INCHARGE, UserRole.PARENT)
  @RequirePermissions(Permission.ATTENDANCE_REPORT)
  @ApiOperation({ summary: 'Get student attendance report (date range)' })
  async getStudentReport(
    @SchoolId() schoolId: number,
    @Body() dto: AttendanceReportDto,
  ) {
    const result = await this.attendanceService.getAttendanceReport(schoolId, dto);
    return { success: true, data: result };
  }

  // ─── Staff Attendance ─────────────────────────────────

  @Post('staff/mark')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.ATTENDANCE_STAFF_MARK)
  @ApiOperation({ summary: 'Mark staff/teacher attendance (by admin)' })
  async markStaffAttendance(
    @SchoolId() schoolId: number,
    @CurrentUser('user_id') userId: number,
    @Body() dto: MarkStaffAttendanceDto,
  ) {
    const result = await this.attendanceService.markStaffAttendance(schoolId, dto, userId);
    return { success: true, data: result };
  }

  @Get('staff/report')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.ATTENDANCE_REPORT)
  @ApiOperation({ summary: 'Get staff attendance report' })
  async getStaffReport(
    @SchoolId() schoolId: number,
    @Query('from_date') fromDate: string,
    @Query('to_date') toDate: string,
  ) {
    const result = await this.attendanceService.getStaffAttendanceReport(schoolId, fromDate, toDate);
    return { success: true, data: result };
  }
}
