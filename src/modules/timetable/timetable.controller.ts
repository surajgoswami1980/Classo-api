import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { RequirePermissions, Permission } from '../../common/decorators/permissions.decorator';
import { SchoolId } from '../../common/decorators/school-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TimetableService } from './timetable.service';

@ApiTags('Timetable')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('timetable')
export class TimetableController {
  constructor(private readonly timetableService: TimetableService) {}

  @Get('class')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.TEACHER, UserRole.INCHARGE)
  @RequirePermissions(Permission.TIMETABLE_VIEW)
  @ApiOperation({ summary: 'Get timetable for a class/section' })
  async getClassTimetable(
    @SchoolId() schoolId: number,
    @Query('class_id') classId: number,
    @Query('section_id') sectionId: number,
  ) {
    const result = await this.timetableService.getClassTimetable(schoolId, classId, sectionId);
    return { success: true, data: result };
  }

  @Get('today')
  @Roles(UserRole.STUDENT, UserRole.PARENT)
  @ApiOperation({ summary: 'Get today timetable for student' })
  async getStudentTodayTimetable(
    @SchoolId() schoolId: number,
    @CurrentUser('user_id') userId: number,
  ) {
    const result = await this.timetableService.getStudentTodayTimetable(schoolId, userId);
    return { success: true, data: result };
  }

  @Get('week')
  @ApiOperation({ summary: 'Get full week timetable for student' })
  async getStudentWeekTimetable(
    @SchoolId() schoolId: number,
    @CurrentUser('user_id') userId: number,
  ) {
    const result = await this.timetableService.getStudentWeekTimetable(schoolId, userId);
    return { success: true, data: result };
  }
}
