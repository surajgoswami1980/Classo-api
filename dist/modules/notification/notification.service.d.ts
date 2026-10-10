import { Repository } from 'typeorm';
import { NotificationEntity } from '../../entities/notification.entity';
import { NotificationReadEntity } from '../../entities/notification-read.entity';
import { DeviceTokenEntity } from '../../entities/device-token.entity';
import { PushQueueService } from './push-queue.service';
import { SendNotificationDto, SendBulkNotificationDto, ListNotificationsQueryDto, RegisterTokenDto } from './dto/notification.dto';
export declare class NotificationService {
    private notifRepo;
    private readRepo;
    private tokenRepo;
    private pushQueue;
    constructor(notifRepo: Repository<NotificationEntity>, readRepo: Repository<NotificationReadEntity>, tokenRepo: Repository<DeviceTokenEntity>, pushQueue: PushQueueService);
    registerToken(schoolId: number | null, userId: number, dto: RegisterTokenDto): Promise<{
        message: string;
    }>;
    unregisterToken(userId: number, token: string): Promise<{
        message: string;
    }>;
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
