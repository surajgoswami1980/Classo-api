import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { SchoolId } from '../../common/decorators/school-id.decorator';
import { ReportService } from './report.service';

@ApiTags('Report')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
@Controller('report')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('attendance')
  @ApiOperation({ summary: 'Attendance report by class/section over a date range' })
  async getAttendanceReport(
    @SchoolId() schoolId: number,
    @Query('from_date') fromDate: string,
    @Query('to_date') toDate: string,
    @Query('class_id') classId?: number,
    @Query('section_id') sectionId?: number,
  ) {
    const result = await this.reportService.getAttendanceReport(schoolId, fromDate, toDate, classId, sectionId);
    return { success: true, data: result };
  }

  @Get('fee-collection')
  @ApiOperation({ summary: 'Fee collection totals per class and overall' })
  async getFeeCollectionReport(
    @SchoolId() schoolId: number,
    @Query('from_date') fromDate: string,
    @Query('to_date') toDate: string,
  ) {
    const result = await this.reportService.getFeeCollectionReport(schoolId, fromDate, toDate);
    return { success: true, data: result };
  }

  @Get('exam-performance')
  @ApiOperation({ summary: 'Class-wise and subject-wise result analysis for an exam' })
  async getExamPerformanceReport(@SchoolId() schoolId: number, @Query('exam_id') examId: number) {
    const result = await this.reportService.getExamPerformanceReport(schoolId, examId);
    return { success: true, data: result };
  }

  @Get('student-strength')
  @ApiOperation({ summary: 'Student headcount per class/section' })
  async getStudentStrengthReport(@SchoolId() schoolId: number) {
    const result = await this.reportService.getStudentStrengthReport(schoolId);
    return { success: true, data: result };
  }
}
