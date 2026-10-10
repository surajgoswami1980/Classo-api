import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NotificationEntity } from '../../entities/notification.entity';
import { NotificationReadEntity } from '../../entities/notification-read.entity';
import { DeviceTokenEntity } from '../../entities/device-token.entity';
import { PushQueueService } from './push-queue.service';
import {
  SendNotificationDto,
  SendBulkNotificationDto,
  ListNotificationsQueryDto,
  RegisterTokenDto,
} from './dto/notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationEntity)
    private notifRepo: Repository<NotificationEntity>,
    @InjectRepository(NotificationReadEntity)
    private readRepo: Repository<NotificationReadEntity>,
    @InjectRepository(DeviceTokenEntity)
    private tokenRepo: Repository<DeviceTokenEntity>,
    private pushQueue: PushQueueService,
  ) {}

  // ─── Device tokens (FCM) ─────────────────────────────────────────────

  /**
   * Register (or re-assign) an FCM device token to the current user. A token
   * is globally unique: if it already exists for another user, it's moved to
   * this user (device changed accounts). Idempotent per user+token.
   */
  async registerToken(schoolId: number | null, userId: number, dto: RegisterTokenDto) {
    if (!dto?.token) throw new BadRequestException('token is required');

    const existing = await this.tokenRepo.findOne({ where: { token: dto.token } });
    if (existing) {
      existing.user_id = userId;
      existing.school_id = schoolId;
      existing.platform = dto.platform || existing.platform || 'android';
      existing.is_active = true;
      existing.last_used_at = new Date();
      await this.tokenRepo.save(existing);
      return { message: 'Token updated' };
    }

    await this.tokenRepo.save(
      this.tokenRepo.create({
        school_id: schoolId,
        user_id: userId,
        token: dto.token,
        platform: dto.platform || 'android',
        is_active: true,
        last_used_at: new Date(),
      }),
    );
    return { message: 'Token registered' };
  }

  /** Deactivate a token (logout). */
  async unregisterToken(userId: number, token: string) {
    if (!token) throw new BadRequestException('token is required');
    await this.tokenRepo.update({ token, user_id: userId }, { is_active: false });
    return { message: 'Token removed' };
  }

  async sendNotification(schoolId: number, sentBy: number, data: SendNotificationDto) {
    const notification = this.notifRepo.create({
      school_id: schoolId,
      title: data.title,
      body: data.body,
      channel: data.channel || 'all',
      target_type: data.target_type,
      target_role: data.target_role || null,
      target_class_id: data.target_class_id || null,
      target_section_id: data.target_section_id || null,
      target_user_ids: data.target_user_ids || null,
      sent_by: sentBy,
      status: 'sent',
      sent_at: new Date(),
    });

    const saved = await this.notifRepo.save(notification);

    // Enqueue push fan-out (Redis queue → worker). Non-blocking: if Redis is
    // down the in-app notification is still saved and shown.
    try {
      await this.pushQueue.enqueue({ notification_id: saved.id, school_id: schoolId });
    } catch {
      // queue unavailable — in-app notification still works
    }

    return {
      id: saved.id,
      message: 'Notification sent successfully',
    };
  }

  async listNotifications(schoolId: number, userRole: string, userId: number, query?: ListNotificationsQueryDto) {
    const limit = query?.limit || 50;

    // Get notifications targeted to this user's role or to all
    const qb = this.notifRepo
      .createQueryBuilder('n')
      .where('n.school_id = :schoolId', { schoolId })
      .andWhere('n.status = :status', { status: 'sent' })
      .andWhere(
        '(n.target_type = :all OR (n.target_type = :role AND n.target_role = :userRole))',
        { all: 'all', role: 'role', userRole },
      )
      .orderBy('n.created_at', 'DESC')
      .take(limit);

    const notifications = await qb.getMany();

    const readIds = notifications.length
      ? new Set(
          (
            await this.readRepo.find({
              where: { user_id: userId, notification_id: In(notifications.map((n) => n.id)) },
            })
          ).map((r) => r.notification_id),
        )
      : new Set();

    const mapped = notifications
      .map((n) => ({
        id: n.id,
        title: n.title,
        body: n.body,
        channel: n.channel,
        target_type: n.target_type,
        sent_at: n.sent_at,
        created_at: n.created_at,
        is_read: readIds.has(n.id),
      }))
      .filter((n) => (query?.unread === 'true' ? !n.is_read : true));

    return {
      notifications: mapped,
      total: mapped.length,
      unread_count: notifications.length - readIds.size,
    };
  }

  /**
   * Mark a single notification as read for the current user. Idempotent —
   * re-marking an already-read notification is a no-op, not an error.
   */
  async markAsRead(schoolId: number, notificationId: number, userId: number) {
    const notification = await this.notifRepo.findOne({ where: { id: notificationId, school_id: schoolId } });
    if (!notification) throw new NotFoundException('Notification not found');

    const existing = await this.readRepo.findOne({ where: { notification_id: notificationId, user_id: userId } });
    if (existing) return { message: 'Already marked as read' };

    await this.readRepo.save(
      this.readRepo.create({
        school_id: schoolId,
        notification_id: notificationId,
        user_id: userId,
        read_at: new Date(),
      }),
    );

    return { message: 'Marked as read' };
  }

  async sendBulkNotification(schoolId: number, sentBy: number, data: SendBulkNotificationDto) {
    return this.sendNotification(schoolId, sentBy, data);
  }
}
