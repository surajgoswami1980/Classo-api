import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { RequirePermissions, Permission } from '../../common/decorators/permissions.decorator';
import { SchoolId } from '../../common/decorators/school-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AssignmentService } from './assignment.service';

@ApiTags('Assignment')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('assignment')
export class AssignmentController {
  constructor(private readonly assignmentService: AssignmentService) {}

  @Post('create')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.TEACHER, UserRole.INCHARGE)
  @RequirePermissions(Permission.ASSIGNMENT_CREATE)
  @ApiOperation({ summary: 'Create assignment (teacher/admin)' })
  async createAssignment(
    @Body() body: {
      class_id: number;
      section_id: number;
      subject_id: number;
      title: string;
      description?: string;
      due_date: string;
      max_marks?: number;
      attachment_url?: string;
      attachment_type?: string;
    },
    @SchoolId() schoolId: number,
    @CurrentUser('user_id') userId: number,
  ) {
    const result = await this.assignmentService.createAssignment(schoolId, userId, body);
    return { success: true, data: result };
  }

  @Get('list')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.TEACHER, UserRole.INCHARGE)
  @RequirePermissions(Permission.ASSIGNMENT_VIEW)
  @ApiOperation({ summary: 'List teacher assignments' })
  async listTeacherAssignments(
    @SchoolId() schoolId: number,
    @CurrentUser('user_id') userId: number,
    @Query('class_id') classId?: number,
    @Query('section_id') sectionId?: number,
  ) {
    const result = await this.assignmentService.listTeacherAssignments(schoolId, userId, {
      class_id: classId,
      section_id: sectionId,
    });
    return { success: true, data: result };
  }

  @Get('student/list')
  @Roles(UserRole.STUDENT, UserRole.PARENT)
  @ApiOperation({ summary: 'List assignments for a student (by their class)' })
  async listStudentAssignments(
    @SchoolId() schoolId: number,
    @CurrentUser('user_id') userId: number,
  ) {
    const result = await this.assignmentService.listStudentAssignments(schoolId, userId);
    return { success: true, data: result };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get assignment detail' })
  async getAssignmentDetail(
    @Param('id') id: number,
    @SchoolId() schoolId: number,
  ) {
    const result = await this.assignmentService.getAssignment(schoolId, id);
    return { success: true, data: result };
  }

  @Delete(':id')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.TEACHER, UserRole.INCHARGE)
  @RequirePermissions(Permission.ASSIGNMENT_CREATE)
  @ApiOperation({ summary: 'Delete assignment' })
  async deleteAssignment(
    @Param('id') id: number,
    @SchoolId() schoolId: number,
    @CurrentUser('user_id') userId: number,
  ) {
    const result = await this.assignmentService.deleteAssignment(schoolId, id, userId);
    return { success: true, data: result };
  }
}
