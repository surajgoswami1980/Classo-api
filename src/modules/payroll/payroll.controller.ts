import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { RequirePermissions, Permission } from '../../common/decorators/permissions.decorator';
import { SchoolId } from '../../common/decorators/school-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PayrollService } from './payroll.service';
import { SalaryStructureDto, GeneratePayslipDto, MarkPaidDto } from './dto/payroll.dto';

@ApiTags('Payroll')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('payroll')
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  // ─── Self-service (staff / teacher) ──────────────────────────

  @Get('my-payslips')
  @Roles(UserRole.TEACHER, UserRole.STAFF, UserRole.SUB_ADMIN, UserRole.INCHARGE)
  @ApiOperation({ summary: "A staff member's own payslips" })
  async myPayslips(@SchoolId() schoolId: number, @CurrentUser('user_id') userId: number) {
    const result = await this.payrollService.myPayslips(schoolId, userId);
    return { success: true, data: result };
  }

  // ─── Salary structures (admin) ───────────────────────────────

  @Get('staff')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.PAYROLL_VIEW)
  @ApiOperation({ summary: 'List staff eligible for payroll' })
  async listStaff(@SchoolId() schoolId: number) {
    const result = await this.payrollService.listStaff(schoolId);
    return { success: true, data: result };
  }

  @Get('structure/list')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.PAYROLL_VIEW)
  @ApiOperation({ summary: 'List salary structures' })
  async listStructures(@SchoolId() schoolId: number) {
    const result = await this.payrollService.listStructures(schoolId);
    return { success: true, data: result };
  }

  @Post('structure')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.PAYROLL_MANAGE)
  @ApiOperation({ summary: 'Create/update a salary structure' })
  async upsertStructure(@SchoolId() schoolId: number, @Body() dto: SalaryStructureDto) {
    const result = await this.payrollService.upsertStructure(schoolId, dto);
    return { success: true, data: result };
  }

  // ─── Payslips (admin) ────────────────────────────────────────

  @Get('payslip/list')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.PAYROLL_VIEW)
  @ApiOperation({ summary: 'List payslips (filter by month/year)' })
  async listPayslips(
    @SchoolId() schoolId: number,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    const result = await this.payrollService.listPayslips(schoolId, month ? Number(month) : undefined, year ? Number(year) : undefined);
    return { success: true, data: result };
  }

  @Post('payslip/generate')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.PAYROLL_MANAGE)
  @ApiOperation({ summary: 'Generate a payslip for a staff member' })
  async generatePayslip(@SchoolId() schoolId: number, @Body() dto: GeneratePayslipDto) {
    const result = await this.payrollService.generatePayslip(schoolId, dto);
    return { success: true, data: result };
  }

  @Post('payslip/mark-paid')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.PAYROLL_MANAGE)
  @ApiOperation({ summary: 'Mark a payslip as paid' })
  async markPaid(@SchoolId() schoolId: number, @Body() dto: MarkPaidDto) {
    const result = await this.payrollService.markPaid(schoolId, dto);
    return { success: true, data: result };
  }

  @Get('summary')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.PAYROLL_VIEW)
  @ApiOperation({ summary: 'Payroll summary for a month/year' })
  async summary(@SchoolId() schoolId: number, @Query('month') month: number, @Query('year') year: number) {
    const result = await this.payrollService.getSummary(schoolId, Number(month), Number(year));
    return { success: true, data: result };
  }
}
