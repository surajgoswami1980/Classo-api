import { Repository } from 'typeorm';
import { NotificationEntity } from '../../entities/notification.entity';
import { NotificationReadEntity } from '../../entities/notification-read.entity';
export declare class NotificationService {
    private notifRepo;
    private readRepo;
    constructor(notifRepo: Repository<NotificationEntity>, readRepo: Repository<NotificationReadEntity>);
    sendNotification(schoolId: number, sentBy: number, data: {
        title: string;
        body: string;
        channel?: string;
        target_type: string;
        target_role?: string;
        target_class_id?: number;
        target_section_id?: number;
        target_user_ids?: number[];
    }): Promise<{
        id: number;
        message: string;
    }>;
    listNotifications(schoolId: number, userRole: string, userId: number, query?: {
        limit?: number;
        unread?: string;
    }): Promise<{
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
    sendBulkNotification(schoolId: number, sentBy: number, data: {
        title: string;
        body: string;
        channel?: string;
        target_type: string;
        target_role?: string;
        target_class_id?: number;
        target_section_id?: number;
    }): Promise<{
        id: number;
        message: string;
    }>;
}
