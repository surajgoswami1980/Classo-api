import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { RequirePermissions, Permission } from '../../common/decorators/permissions.decorator';
import { SchoolId } from '../../common/decorators/school-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TransportService } from './transport.service';
import { CreateRouteDto, CreateStopDto, CreateVehicleDto, AssignStudentTransportDto } from './dto/transport.dto';

@ApiTags('Transport')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('transport')
export class TransportController {
  constructor(private readonly transportService: TransportService) {}

  @Get('my')
  @Roles(UserRole.STUDENT, UserRole.PARENT)
  @ApiOperation({ summary: "A student's own transport assignment — route, stop, driver, vehicle" })
  async getMyTransport(@SchoolId() schoolId: number, @CurrentUser('user_id') userId: number) {
    const result = await this.transportService.getMyTransport(schoolId, userId);
    return { success: true, data: result };
  }

  @Get('route/list')
  @RequirePermissions(Permission.TRANSPORT_VIEW)
  @ApiOperation({ summary: 'List routes with vehicle info and student counts' })
  async listRoutes(@SchoolId() schoolId: number) {
    const result = await this.transportService.listRoutes(schoolId);
    return { success: true, data: result };
  }

  @Post('route/create')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.TRANSPORT_MANAGE)
  @ApiOperation({ summary: 'Create a transport route' })
  async createRoute(@Body() dto: CreateRouteDto, @SchoolId() schoolId: number) {
    const result = await this.transportService.createRoute(schoolId, dto);
    return { success: true, data: result };
  }

  @Post('stop/create')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.TRANSPORT_MANAGE)
  @ApiOperation({ summary: 'Add a stop to a route' })
  async addStop(@Body() dto: CreateStopDto, @SchoolId() schoolId: number) {
    const result = await this.transportService.addStop(schoolId, dto);
    return { success: true, data: result };
  }

  @Get('route/:routeId/stops')
  @RequirePermissions(Permission.TRANSPORT_VIEW)
  @ApiOperation({ summary: 'List stops for a route, in sequence' })
  async listStops(@Param('routeId') routeId: number, @SchoolId() schoolId: number) {
    const result = await this.transportService.listStops(schoolId, routeId);
    return { success: true, data: result };
  }

  @Get('vehicle/list')
  @RequirePermissions(Permission.TRANSPORT_VIEW)
  @ApiOperation({ summary: 'List vehicles' })
  async listVehicles(@SchoolId() schoolId: number) {
    const result = await this.transportService.listVehicles(schoolId);
    return { success: true, data: result };
  }

  @Post('vehicle/create')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.TRANSPORT_MANAGE)
  @ApiOperation({ summary: 'Add a vehicle' })
  async createVehicle(@Body() dto: CreateVehicleDto, @SchoolId() schoolId: number) {
    const result = await this.transportService.createVehicle(schoolId, dto);
    return { success: true, data: result };
  }

  @Get('vehicle/expiring')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.TRANSPORT_VIEW)
  @ApiOperation({ summary: 'Vehicles with insurance/fitness expiring within 30 days' })
  async getExpiringDocuments(@Query('days') days: number, @SchoolId() schoolId: number) {
    const result = await this.transportService.getExpiringDocuments(schoolId, days ? Number(days) : 30);
    return { success: true, data: result };
  }

  @Post('student/assign')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.TRANSPORT_MANAGE)
  @ApiOperation({ summary: 'Assign a student to a transport route and stop' })
  async assignStudent(@Body() dto: AssignStudentTransportDto, @SchoolId() schoolId: number) {
    const result = await this.transportService.assignStudent(schoolId, dto);
    return { success: true, data: result };
  }
}
