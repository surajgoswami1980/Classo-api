import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { RequirePermissions, Permission } from '../../common/decorators/permissions.decorator';
import { SchoolId } from '../../common/decorators/school-id.decorator';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto, UpdateAcademicYearDto } from './dto/settings.dto';

@ApiTags('Settings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @RequirePermissions(Permission.SETTINGS_VIEW)
  @ApiOperation({ summary: 'Get school settings (grading scale, thresholds, working days, etc.)' })
  async getSettings(@SchoolId() schoolId: number) {
    const result = await this.settingsService.getSettings(schoolId);
    return { success: true, data: result };
  }

  @Put()
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  @ApiOperation({ summary: 'Update school settings' })
  async updateSettings(@Body() dto: UpdateSettingsDto, @SchoolId() schoolId: number) {
    const result = await this.settingsService.updateSettings(schoolId, dto);
    return { success: true, data: result };
  }

  @Get('academic-year')
  @RequirePermissions(Permission.SETTINGS_VIEW)
  @ApiOperation({ summary: 'Get the current academic year and session history' })
  async getAcademicYear(@SchoolId() schoolId: number) {
    const result = await this.settingsService.getAcademicYear(schoolId);
    return { success: true, data: result };
  }

  @Put('academic-year')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.SETTINGS_MANAGE)
  @ApiOperation({ summary: 'Create/update an academic year, optionally making it current' })
  async updateAcademicYear(@Body() dto: UpdateAcademicYearDto, @SchoolId() schoolId: number) {
    const result = await this.settingsService.updateAcademicYear(schoolId, dto);
    return { success: true, data: result };
  }
}
