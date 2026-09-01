import { NotificationService } from './notification.service';
export declare class NotificationController {
    private readonly notificationService;
    constructor(notificationService: NotificationService);
    sendNotification(body: {
        title: string;
        body: string;
        channel?: string;
        target_type: string;
        target_role?: string;
        target_class_id?: number;
        target_section_id?: number;
        target_user_ids?: number[];
    }, schoolId: number, userId: number): Promise<{
        success: boolean;
        data: {
            id: number;
            message: string;
        };
    }>;
    listNotifications(query: {
        limit?: number;
        unread?: string;
    }, schoolId: number, userId: number, userRole: string): Promise<{
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
    markAsRead(id: number, schoolId: number, userId: number): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
    sendBulkNotification(body: {
        title: string;
        body: string;
        channel?: string;
        target_type: string;
        target_role?: string;
        target_class_id?: number;
        target_section_id?: number;
    }, schoolId: number, userId: number): Promise<{
        success: boolean;
        data: {
            id: number;
            message: string;
        };
    }>;
}
