import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { RequirePermissions, Permission } from '../../common/decorators/permissions.decorator';
import { SchoolId } from '../../common/decorators/school-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TeacherService } from './teacher.service';
import { CreateTeacherDto, UpdateTeacherDto, ListTeachersQueryDto } from './dto/teacher.dto';

@ApiTags('Teacher')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('teacher')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @Get('list')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.TEACHER_VIEW)
  @ApiOperation({ summary: 'List teachers, paginated' })
  async listTeachers(@Query() query: ListTeachersQueryDto, @SchoolId() schoolId: number) {
    const result = await this.teacherService.listTeachers(schoolId, query);
    return { success: true, ...result };
  }

  @Post('create')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.TEACHER_CREATE)
  @ApiOperation({ summary: 'Create a new teacher' })
  async createTeacher(@Body() dto: CreateTeacherDto, @SchoolId() schoolId: number) {
    const result = await this.teacherService.createTeacher(schoolId, dto);
    return { success: true, data: result };
  }

  @Get(':id')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.TEACHER)
  @RequirePermissions(Permission.TEACHER_VIEW)
  @ApiOperation({ summary: 'Get full teacher detail' })
  async getTeacherDetail(
    @Param('id') id: number,
    @SchoolId() schoolId: number,
    @CurrentUser('user_id') userId: number,
    @CurrentUser('role') role: string,
  ) {
    const result = await this.teacherService.getTeacherDetail(schoolId, id, userId, role);
    return { success: true, data: result };
  }

  @Get(':id/workload')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.TEACHER)
  @RequirePermissions(Permission.TEACHER_VIEW)
  @ApiOperation({ summary: 'Teacher workload — weekly periods and class assignments' })
  async getTeacherWorkload(
    @Param('id') id: number,
    @SchoolId() schoolId: number,
    @CurrentUser('user_id') userId: number,
    @CurrentUser('role') role: string,
  ) {
    const result = await this.teacherService.getTeacherWorkload(schoolId, id, userId, role);
    return { success: true, data: result };
  }

  @Put(':id')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.TEACHER_UPDATE)
  @ApiOperation({ summary: 'Update a teacher (including resignation)' })
  async updateTeacher(@Param('id') id: number, @Body() dto: UpdateTeacherDto, @SchoolId() schoolId: number) {
    const result = await this.teacherService.updateTeacher(schoolId, id, dto);
    return { success: true, data: result };
  }
}
