import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { CreateSchoolDto, ToggleSchoolStatusDto, ListSchoolsQueryDto } from './dto/super-admin.dto';

@ApiTags('Super Admin')
@ApiBearerAuth()
@UseGuards(SuperAdminGuard)
@Controller('super-admin')
export class SuperAdminController {
  constructor(private readonly superAdminService: SuperAdminService) {}

  @Get('schools')
  @ApiOperation({ summary: 'List all schools on the platform' })
  async listSchools(@Query() query: ListSchoolsQueryDto) {
    const result = await this.superAdminService.listSchools(query);
    return { success: true, ...result };
  }

  @Post('school/create')
  @ApiOperation({ summary: 'Onboard a new school with its initial admin account' })
  async createSchool(@Body() dto: CreateSchoolDto) {
    const result = await this.superAdminService.createSchool(dto);
    return { success: true, data: result };
  }

  @Post('school/toggle-status')
  @ApiOperation({ summary: 'Enable or disable a school' })
  async toggleSchoolStatus(@Body() dto: ToggleSchoolStatusDto) {
    const result = await this.superAdminService.toggleSchoolStatus(dto);
    return { success: true, data: result };
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Platform-wide dashboard: tenants, subscriptions, revenue share' })
  async getDashboard() {
    const result = await this.superAdminService.getDashboard();
    return { success: true, data: result };
  }
}
