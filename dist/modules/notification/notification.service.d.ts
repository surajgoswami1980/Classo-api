import { Repository } from 'typeorm';
import { NotificationEntity } from '../../entities/notification.entity';
import { NotificationReadEntity } from '../../entities/notification-read.entity';
import { SendNotificationDto, SendBulkNotificationDto, ListNotificationsQueryDto } from './dto/notification.dto';
export declare class NotificationService {
    private notifRepo;
    private readRepo;
    constructor(notifRepo: Repository<NotificationEntity>, readRepo: Repository<NotificationReadEntity>);
    sendNotification(schoolId: number, sentBy: number, data: SendNotificationDto): Promise<{
        id: number;
        message: string;
    }>;
    listNotifications(schoolId: number, userRole: string, userId: number, query?: ListNotificationsQueryDto): Promise<{
        notifications: {
            id: number;
            title: string;
            body: string;
            channel: string;
            target_type: string;
            sent_at: Date;
            created_at: Date;
            is_read: boolean;
        }[];
        total: number;
        unread_count: number;
    }>;
    markAsRead(schoolId: number, notificationId: number, userId: number): Promise<{
        message: string;
    }>;
    sendBulkNotification(schoolId: number, sentBy: number, data: SendBulkNotificationDto): Promise<{
        id: number;
        message: string;
    }>;
}
