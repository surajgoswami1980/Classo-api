import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { NotificationEntity } from '../../entities/notification.entity';
import { NotificationReadEntity } from '../../entities/notification-read.entity';
import {
  SendNotificationDto,
  SendBulkNotificationDto,
  ListNotificationsQueryDto,
} from './dto/notification.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(NotificationEntity)
    private notifRepo: Repository<NotificationEntity>,
    @InjectRepository(NotificationReadEntity)
    private readRepo: Repository<NotificationReadEntity>,
  ) {}

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
