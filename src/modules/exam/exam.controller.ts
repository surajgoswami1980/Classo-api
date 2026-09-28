import { Controller, Post, Get, Body, Param, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { ExamService, CreateExamDto, EnterMarksDto } from './exam.service';
import { ReportCardPdfService } from '../report/report-card-pdf.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { RequirePermissions, Permission } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SchoolId } from '../../common/decorators/school-id.decorator';

@ApiTags('Exam')
@Controller('exam')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class ExamController {
  constructor(
    private readonly examService: ExamService,
    private readonly reportCardPdf: ReportCardPdfService,
  ) {}

  @Post('create')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.EXAM_CREATE)
  @ApiOperation({ summary: 'Create a new exam' })
  async createExam(@SchoolId() schoolId: number, @Body() dto: CreateExamDto) {
    const result = await this.examService.createExam(schoolId, dto);
    return { success: true, data: result };
  }

  @Get('list')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.TEACHER, UserRole.INCHARGE)
  @RequirePermissions(Permission.EXAM_VIEW)
  @ApiOperation({ summary: 'List all exams' })
  async listExams(
    @SchoolId() schoolId: number,
    @Query('session_id') sessionId?: number,
  ) {
    const result = await this.examService.listExams(schoolId, sessionId);
    return { success: true, data: result };
  }

  @Get('subjects')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.TEACHER, UserRole.INCHARGE)
  @RequirePermissions(Permission.EXAM_VIEW)
  @ApiOperation({ summary: 'List subjects configured for an exam+class (for the marks-entry subject dropdown)' })
  async getExamSubjects(
    @SchoolId() schoolId: number,
    @Query('exam_id') examId: number,
    @Query('class_id') classId: number,
  ) {
    const result = await this.examService.getExamSubjects(schoolId, examId, classId);
    return { success: true, data: result };
  }

  @Get('marks/entry-data')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.TEACHER, UserRole.INCHARGE)
  @RequirePermissions(Permission.EXAM_MARKS_ENTRY)
  @ApiOperation({ summary: 'Get students list + existing marks for marks entry page' })
  async getMarksEntryData(
    @SchoolId() schoolId: number,
    @Query('exam_id') examId: number,
    @Query('exam_subject_id') examSubjectId: number,
    @Query('class_id') classId: number,
    @Query('section_id') sectionId: number,
  ) {
    const result = await this.examService.getMarksEntryData(schoolId, examId, examSubjectId, classId, sectionId);
    return { success: true, data: result };
  }

  @Post('marks/enter')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.TEACHER, UserRole.INCHARGE)
  @RequirePermissions(Permission.EXAM_MARKS_ENTRY)
  @ApiOperation({ summary: 'Enter/update marks for students (bulk)' })
  async enterMarks(
    @SchoolId() schoolId: number,
    @CurrentUser('user_id') userId: number,
    @Body() dto: EnterMarksDto,
  ) {
    const result = await this.examService.enterMarks(schoolId, dto, userId);
    return { success: true, data: result };
  }

  @Post('publish/:examId')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.EXAM_PUBLISH)
  @ApiOperation({ summary: 'Publish exam results (make visible to students/parents)' })
  async publishExam(
    @SchoolId() schoolId: number,
    @Param('examId') examId: number,
  ) {
    const result = await this.examService.publishExam(schoolId, examId);
    return { success: true, data: result };
  }

  @Get('report-card/:studentId')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT)
  @ApiOperation({ summary: 'Get report card for a student' })
  async getReportCard(
    @SchoolId() schoolId: number,
    @Param('studentId') studentId: number,
    @Query('exam_id') examId: number,
  ) {
    const result = await this.examService.getReportCard(schoolId, studentId, examId);
    return { success: true, data: result };
  }

  @Get('report-card/:studentId/pdf')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.TEACHER, UserRole.STUDENT, UserRole.PARENT)
  @ApiOperation({ summary: 'Download report card as PDF (HTML response for PDF generation)' })
  async getReportCardPdf(
    @SchoolId() schoolId: number,
    @Param('studentId') studentId: number,
    @Query('exam_id') examId: number,
    @Res() res: Response,
  ) {
    const reportCard: any = await this.examService.getReportCard(schoolId, studentId, examId);

    // Get school info for branding (resolved from the school entity)
    const schoolInfo = await this.examService.getSchoolBranding(schoolId);

    const html = this.reportCardPdf.generateReportCardHtml({
      student: {
        name: reportCard.student.name,
        roll_number: reportCard.student.roll_number,
        admission_number: reportCard.student.admission_number,
        class_name: `Class ${reportCard.student.class_id}`,
        section_name: '',
      },
      exam: {
        name: reportCard.exam.name,
        exam_type: reportCard.exam.exam_type,
        session_name: '',
      },
      subjects: reportCard.subjects,
      summary: reportCard.summary,
      school: schoolInfo,
    });

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  @Get('analysis/:examId')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.TEACHER)
  @RequirePermissions(Permission.EXAM_REPORT)
  @ApiOperation({ summary: 'Get class-wise result analysis for an exam' })
  async getResultAnalysis(
    @SchoolId() schoolId: number,
    @Param('examId') examId: number,
    @Query('class_id') classId: number,
  ) {
    const result = await this.examService.getResultAnalysis(schoolId, examId, classId);
    return { success: true, data: result };
  }
}
