import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { RequirePermissions, Permission } from '../../common/decorators/permissions.decorator';
import { SchoolId } from '../../common/decorators/school-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { NotificationService } from './notification.service';
import {
  SendNotificationDto,
  SendBulkNotificationDto,
  ListNotificationsQueryDto,
} from './dto/notification.dto';

@ApiTags('Notification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('notification')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('send')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.TEACHER, UserRole.INCHARGE)
  @RequirePermissions(Permission.NOTIFICATION_SEND)
  @ApiOperation({ summary: 'Send a notification' })
  async sendNotification(
    @Body() body: SendNotificationDto,
    @SchoolId() schoolId: number,
    @CurrentUser('user_id') userId: number,
  ) {
    const result = await this.notificationService.sendNotification(schoolId, userId, body);
    return { success: true, data: result };
  }

  @Get('list')
  @ApiOperation({ summary: 'List notifications for current user' })
  async listNotifications(
    @Query() query: ListNotificationsQueryDto,
    @SchoolId() schoolId: number,
    @CurrentUser('user_id') userId: number,
    @CurrentUser('role') userRole: string,
  ) {
    const result = await this.notificationService.listNotifications(schoolId, userRole, userId, query);
    return { success: true, data: result };
  }

  @Put(':id/read')
  @ApiOperation({ summary: 'Mark a notification as read for the current user' })
  async markAsRead(
    @Param('id') id: number,
    @SchoolId() schoolId: number,
    @CurrentUser('user_id') userId: number,
  ) {
    const result = await this.notificationService.markAsRead(schoolId, id, userId);
    return { success: true, data: result };
  }

  @Post('send-bulk')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.TEACHER)
  @RequirePermissions(Permission.NOTIFICATION_SEND)
  @ApiOperation({ summary: 'Send bulk notification' })
  async sendBulkNotification(
    @Body() body: SendBulkNotificationDto,
    @SchoolId() schoolId: number,
    @CurrentUser('user_id') userId: number,
  ) {
    const result = await this.notificationService.sendBulkNotification(schoolId, userId, body);
    return { success: true, data: result };
  }
}
