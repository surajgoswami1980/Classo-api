import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { RequirePermissions, Permission } from '../../common/decorators/permissions.decorator';
import { SchoolId } from '../../common/decorators/school-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { EventService } from './event.service';
import {
  CreateEventDto,
  UpdateEventDto,
  ListEventsQueryDto,
  RegisterEventDto,
  VerifyEventPaymentDto,
} from './dto/event.dto';

@ApiTags('Event')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  // ─── Admin ───────────────────────────────────────────────────

  @Post('create')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.EVENT_MANAGE)
  @ApiOperation({ summary: 'Create an event' })
  async create(@SchoolId() schoolId: number, @CurrentUser('user_id') userId: number, @Body() dto: CreateEventDto) {
    const result = await this.eventService.createEvent(schoolId, dto, userId);
    return { success: true, data: result };
  }

  @Put(':id')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.EVENT_MANAGE)
  @ApiOperation({ summary: 'Update an event' })
  async update(@SchoolId() schoolId: number, @Param('id') id: number, @Body() dto: UpdateEventDto) {
    const result = await this.eventService.updateEvent(schoolId, id, dto);
    return { success: true, data: result };
  }

  @Delete(':id')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.EVENT_MANAGE)
  @ApiOperation({ summary: 'Delete an event' })
  async remove(@SchoolId() schoolId: number, @Param('id') id: number) {
    const result = await this.eventService.deleteEvent(schoolId, id);
    return { success: true, data: result };
  }

  @Post('publish/:id')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @RequirePermissions(Permission.EVENT_MANAGE)
  @ApiOperation({ summary: 'Publish an event and notify the audience' })
  async publish(@SchoolId() schoolId: number, @CurrentUser('user_id') userId: number, @Param('id') id: number) {
    const result = await this.eventService.publishEvent(schoolId, id, userId);
    return { success: true, data: result };
  }

  @Get('admin/list')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.TEACHER, UserRole.INCHARGE)
  @RequirePermissions(Permission.EVENT_VIEW)
  @ApiOperation({ summary: 'Admin: list events with registration counts' })
  async adminList(@SchoolId() schoolId: number, @Query() query: ListEventsQueryDto) {
    const result = await this.eventService.listEventsAdmin(schoolId, query);
    return { success: true, ...result };
  }

  @Get(':id/registrations')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.TEACHER, UserRole.INCHARGE)
  @RequirePermissions(Permission.EVENT_VIEW)
  @ApiOperation({ summary: 'Admin: list registrations for an event' })
  async registrations(@SchoolId() schoolId: number, @Param('id') id: number) {
    const result = await this.eventService.listRegistrations(schoolId, id);
    return { success: true, data: result };
  }

  // ─── Student ─────────────────────────────────────────────────

  @Get('list')
  @Roles(UserRole.STUDENT, UserRole.PARENT)
  @ApiOperation({ summary: 'Student: list published upcoming events' })
  async list(@SchoolId() schoolId: number, @CurrentUser('user_id') userId: number) {
    const result = await this.eventService.listEventsForStudent(schoolId, userId);
    return { success: true, data: result };
  }

  @Post('register')
  @Roles(UserRole.STUDENT, UserRole.PARENT)
  @ApiOperation({ summary: 'Student: register for an event (free = instant, paid = Razorpay order)' })
  async register(@SchoolId() schoolId: number, @CurrentUser('user_id') userId: number, @Body() dto: RegisterEventDto) {
    const result = await this.eventService.register(schoolId, userId, dto);
    return { success: true, data: result };
  }

  @Post('payment/verify')
  @Roles(UserRole.STUDENT, UserRole.PARENT)
  @ApiOperation({ summary: 'Student: verify a paid-event Razorpay payment' })
  async verify(@SchoolId() schoolId: number, @CurrentUser('user_id') userId: number, @Body() dto: VerifyEventPaymentDto) {
    const result = await this.eventService.verifyPayment(schoolId, userId, dto);
    return { success: true, data: result };
  }

  @Get('my-registrations')
  @Roles(UserRole.STUDENT, UserRole.PARENT)
  @ApiOperation({ summary: "Student: my event registrations" })
  async myRegistrations(@SchoolId() schoolId: number, @CurrentUser('user_id') userId: number) {
    const result = await this.eventService.myRegistrations(schoolId, userId);
    return { success: true, data: result };
  }

  @Delete('register/:registrationId')
  @Roles(UserRole.STUDENT, UserRole.PARENT)
  @ApiOperation({ summary: 'Student: cancel a registration' })
  async cancel(@SchoolId() schoolId: number, @CurrentUser('user_id') userId: number, @Param('registrationId') registrationId: number) {
    const result = await this.eventService.cancelRegistration(schoolId, userId, registrationId);
    return { success: true, data: result };
  }
}
