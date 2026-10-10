import { NotificationService } from './notification.service';
import { SendNotificationDto, SendBulkNotificationDto, ListNotificationsQueryDto, RegisterTokenDto } from './dto/notification.dto';
export declare class NotificationController {
    private readonly notificationService;
    constructor(notificationService: NotificationService);
    sendNotification(body: SendNotificationDto, schoolId: number, userId: number): Promise<{
        success: boolean;
        data: {
            id: number;
            message: string;
        };
    }>;
    listNotifications(query: ListNotificationsQueryDto, schoolId: number, userId: number, userRole: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    registerToken(body: RegisterTokenDto, schoolId: number, userId: number): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
    unregisterToken(body: {
        token: string;
    }, userId: number): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
    markAsRead(id: number, schoolId: number, userId: number): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
    sendBulkNotification(body: SendBulkNotificationDto, schoolId: number, userId: number): Promise<{
        success: boolean;
        data: {
            id: number;
            message: string;
        };
    }>;
}
