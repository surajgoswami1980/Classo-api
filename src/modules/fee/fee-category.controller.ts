import { Controller, Post, Get, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import {
  FeeCategoryService,
  CreateCategoryDto,
  UpsertClassPlanDto,
  StudentOverrideDto,
  GenerateMonthlyDto,
  GenerateOneTimeDto,
} from './fee-category.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SchoolId } from '../../common/decorators/school-id.decorator';

@ApiTags('Fee Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
@Controller('fee/category')
export class FeeCategoryController {
  constructor(private readonly svc: FeeCategoryService) {}

  // ─── Categories ─────────────────────────────────────────────

  @Get('list')
  @ApiOperation({ summary: 'List fee categories' })
  async list(@SchoolId() schoolId: number) {
    return { success: true, data: await this.svc.listCategories(schoolId) };
  }

  @Post('create')
  @ApiOperation({ summary: 'Create a fee category' })
  async create(@SchoolId() schoolId: number, @Body() dto: CreateCategoryDto) {
    return { success: true, data: await this.svc.createCategory(schoolId, dto) };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a fee category' })
  async update(@SchoolId() schoolId: number, @Param('id') id: number, @Body() dto: any) {
    return { success: true, data: await this.svc.updateCategory(schoolId, Number(id), dto) };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a fee category' })
  async remove(@SchoolId() schoolId: number, @Param('id') id: number) {
    return { success: true, data: await this.svc.deleteCategory(schoolId, Number(id)) };
  }

  // ─── Class plans ────────────────────────────────────────────

  @Get('plans')
  @ApiOperation({ summary: 'List class fee plans (category amounts per class)' })
  async plans(@SchoolId() schoolId: number, @Query('class_id') classId?: number) {
    return { success: true, data: await this.svc.listClassPlans(schoolId, classId ? Number(classId) : undefined) };
  }

  @Post('plans')
  @ApiOperation({ summary: 'Create/update a class fee plan' })
  async upsertPlan(@SchoolId() schoolId: number, @Body() dto: UpsertClassPlanDto) {
    return { success: true, data: await this.svc.upsertClassPlan(schoolId, dto) };
  }

  @Delete('plans/:id')
  @ApiOperation({ summary: 'Remove a class fee plan' })
  async removePlan(@SchoolId() schoolId: number, @Param('id') id: number) {
    return { success: true, data: await this.svc.deleteClassPlan(schoolId, Number(id)) };
  }

  // ─── Student overrides ──────────────────────────────────────

  @Get('student/:studentId/profile')
  @ApiOperation({ summary: 'Get a student’s effective fee amounts per category' })
  async studentProfile(@SchoolId() schoolId: number, @Param('studentId') studentId: number) {
    return { success: true, data: await this.svc.getStudentFeeProfile(schoolId, Number(studentId)) };
  }

  @Post('student/override')
  @ApiOperation({ summary: 'Set a per-student fee amount (increase/decrease)' })
  async setOverride(
    @SchoolId() schoolId: number,
    @CurrentUser('user_id') userId: number,
    @Body() dto: StudentOverrideDto,
  ) {
    return { success: true, data: await this.svc.setStudentOverride(schoolId, dto, userId) };
  }

  @Delete('student/override/:id')
  @ApiOperation({ summary: 'Remove a per-student fee override' })
  async removeOverride(@SchoolId() schoolId: number, @Param('id') id: number) {
    return { success: true, data: await this.svc.removeStudentOverride(schoolId, Number(id)) };
  }

  // ─── Invoice generation ─────────────────────────────────────

  @Post('generate/monthly')
  @ApiOperation({ summary: 'Generate monthly invoices for a category/month' })
  async generateMonthly(@SchoolId() schoolId: number, @Body() dto: GenerateMonthlyDto) {
    return { success: true, data: await this.svc.generateMonthly(schoolId, dto) };
  }

  @Post('generate/one-time')
  @ApiOperation({ summary: 'Generate one-time / exam invoices for a category' })
  async generateOneTime(@SchoolId() schoolId: number, @Body() dto: GenerateOneTimeDto) {
    return { success: true, data: await this.svc.generateOneTime(schoolId, dto) };
  }

  // ─── Admin pending views ────────────────────────────────────

  @Get('pending/by-class')
  @ApiOperation({ summary: 'Class-wise pending fee summary' })
  async pendingByClass(@SchoolId() schoolId: number, @Query('class_id') classId?: number) {
    return { success: true, data: await this.svc.pendingByClass(schoolId, classId ? Number(classId) : undefined) };
  }

  @Get('pending/students/:classId')
  @ApiOperation({ summary: 'Pending invoices for students of a class' })
  async pendingStudents(@SchoolId() schoolId: number, @Param('classId') classId: number) {
    return { success: true, data: await this.svc.pendingStudents(schoolId, Number(classId)) };
  }
}
