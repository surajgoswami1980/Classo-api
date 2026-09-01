import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { RequirePermissions, Permission } from '../../common/decorators/permissions.decorator';
import { SchoolId } from '../../common/decorators/school-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StudentService } from './student.service';
import { CreateStudentDto, UpdateStudentDto, ListStudentsQueryDto, PromoteStudentsDto } from './dto/student.dto';

@ApiTags('Student')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('student')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get('list')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.TEACHER, UserRole.INCHARGE)
  @RequirePermissions(Permission.STUDENT_VIEW)
  @ApiOperation({ summary: 'List students filtered by class/section/status, paginated' })
  async listStudents(@Query() query: ListStudentsQueryDto, @SchoolId() schoolId: number) {
    const result = await this.studentService.listStudents(schoolId, query);
    return { success: true, ...result };
  }

  @Post('create')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.STUDENT_CREATE)
  @ApiOperation({ summary: 'Create a new student' })
  async createStudent(@Body() dto: CreateStudentDto, @SchoolId() schoolId: number) {
    const result = await this.studentService.createStudent(schoolId, dto);
    return { success: true, data: result };
  }

  @Post('import')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.STUDENT_IMPORT)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Bulk import students from a CSV file' })
  async bulkImportStudents(@UploadedFile() file: Express.Multer.File, @SchoolId() schoolId: number) {
    if (!file) throw new BadRequestException('CSV file is required (field name: "file")');
    const result = await this.studentService.bulkImportStudents(schoolId, file.buffer);
    return { success: true, data: result };
  }

  @Get('dashboard')
  @Roles(UserRole.STUDENT, UserRole.PARENT)
  @ApiOperation({ summary: "A student's own dashboard — today's timetable, attendance summary, upcoming assignments" })
  async getStudentDashboard(@CurrentUser('user_id') userId: number, @SchoolId() schoolId: number) {
    const result = await this.studentService.getStudentDashboard(schoolId, userId);
    return { success: true, data: result };
  }

  @Get(':id')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.TEACHER, UserRole.INCHARGE)
  @RequirePermissions(Permission.STUDENT_VIEW)
  @ApiOperation({ summary: 'Get full student detail' })
  async getStudentDetail(@Param('id') id: number, @SchoolId() schoolId: number) {
    const result = await this.studentService.getStudentDetail(schoolId, id);
    return { success: true, data: result };
  }

  @Put(':id')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.STUDENT_UPDATE)
  @ApiOperation({ summary: 'Update a student' })
  async updateStudent(@Param('id') id: number, @Body() dto: UpdateStudentDto, @SchoolId() schoolId: number) {
    const result = await this.studentService.updateStudent(schoolId, id, dto);
    return { success: true, data: result };
  }

  @Post('promote')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.STUDENT_UPDATE)
  @ApiOperation({ summary: 'Promote a batch of students to a new class/section' })
  async promoteStudents(@Body() dto: PromoteStudentsDto, @SchoolId() schoolId: number) {
    const result = await this.studentService.promoteStudents(schoolId, dto);
    return { success: true, data: result };
  }
}
