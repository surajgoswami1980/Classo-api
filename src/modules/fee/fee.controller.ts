import { Controller, Post, Get, Body, Param, Query, UseGuards, Req, Res, HttpCode } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request, Response } from 'express';
import {
  FeeService,
  CreateFeeStructureDto,
  GenerateInvoicesDto,
  InitiatePaymentDto,
  VerifyPaymentDto,
  OfflinePaymentDto,
  InvoiceFiltersDto,
} from './fee.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { RequirePermissions, Permission } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SchoolId } from '../../common/decorators/school-id.decorator';

@ApiTags('Fee')
@Controller('fee')
export class FeeController {
  constructor(private readonly feeService: FeeService) {}

  // ─── Fee Structure (Admin only) ──────────────────────────────

  @Post('structure/create')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.FEE_CREATE)
  @ApiOperation({ summary: 'Create fee structure for a class' })
  async createStructure(@SchoolId() schoolId: number, @Body() dto: CreateFeeStructureDto) {
    const result = await this.feeService.createFeeStructure(schoolId, dto);
    return { success: true, data: result };
  }

  @Get('structure/list')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.FEE_VIEW)
  @ApiOperation({ summary: 'List all fee structures' })
  async listStructures(@SchoolId() schoolId: number, @Query('class_id') classId?: number) {
    const result = await this.feeService.listFeeStructures(schoolId, classId);
    return { success: true, data: result };
  }

  // ─── Invoices ────────────────────────────────────────────────

  @Post('invoice/generate')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.FEE_CREATE)
  @ApiOperation({ summary: 'Generate invoices for all students in a class' })
  async generateInvoices(@SchoolId() schoolId: number, @Body() dto: GenerateInvoicesDto) {
    const result = await this.feeService.generateInvoices(schoolId, dto);
    return { success: true, data: result };
  }

  @Get('invoice/list')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.FEE_VIEW)
  @ApiOperation({ summary: 'List invoices with filters' })
  async listInvoices(@SchoolId() schoolId: number, @Query() filters: InvoiceFiltersDto) {
    const result = await this.feeService.listInvoices(schoolId, filters);
    return { success: true, data: result };
  }

  @Get('invoice/student/:studentId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get invoices for a specific student (parent/student portal)' })
  async getStudentInvoices(@SchoolId() schoolId: number, @Param('studentId') studentId: number) {
    const result = await this.feeService.getStudentInvoices(schoolId, studentId);
    return { success: true, data: result };
  }

  // ─── Payments (Razorpay) ─────────────────────────────────────

  @Post('payment/initiate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate Razorpay payment for an invoice' })
  async initiatePayment(
    @SchoolId() schoolId: number,
    @CurrentUser('user_id') userId: number,
    @Body() dto: InitiatePaymentDto,
  ) {
    const result = await this.feeService.initiatePayment(schoolId, dto, userId);
    return { success: true, data: result };
  }

  @Post('payment/verify')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify Razorpay payment after completion' })
  async verifyPayment(@SchoolId() schoolId: number, @Body() dto: VerifyPaymentDto) {
    const result = await this.feeService.verifyPayment(schoolId, dto);
    return { success: true, data: result };
  }

  @Post('payment/webhook')
  @HttpCode(200)
  @ApiOperation({ summary: 'Razorpay webhook endpoint (no auth required)' })
  async webhook(@Req() req: Request) {
    const result = await this.feeService.handleWebhook(req.body);
    return result;
  }

  @Post('payment/offline/:invoiceId')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.FEE_COLLECT)
  @ApiOperation({ summary: 'Record offline payment (cash/cheque) by admin' })
  async markPaidOffline(
    @SchoolId() schoolId: number,
    @CurrentUser('user_id') userId: number,
    @Param('invoiceId') invoiceId: number,
    @Body() dto: OfflinePaymentDto,
  ) {
    const result = await this.feeService.markPaidOffline(schoolId, invoiceId, dto, userId);
    return { success: true, data: result };
  }

  // ─── Reports ─────────────────────────────────────────────────

  @Get('collection-report')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.FEE_REPORT)
  @ApiOperation({ summary: 'Fee collection report with daily breakdown' })
  async collectionReport(
    @SchoolId() schoolId: number,
    @Query('from_date') fromDate: string,
    @Query('to_date') toDate: string,
  ) {
    const result = await this.feeService.getCollectionReport(schoolId, fromDate, toDate);
    return { success: true, data: result };
  }

  @Get('defaulters')
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @ApiBearerAuth()
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.FEE_VIEW)
  @ApiOperation({ summary: 'Get fee defaulters (students with overdue invoices)' })
  async getDefaulters(@SchoolId() schoolId: number) {
    const result = await this.feeService.getDefaulters(schoolId);
    return { success: true, data: result };
  }
}
