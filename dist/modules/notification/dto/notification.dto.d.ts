export declare class SendNotificationDto {
    title: string;
    body: string;
    channel?: string;
    target_type: string;
    target_role?: string;
    target_class_id?: number;
    target_section_id?: number;
    target_user_ids?: number[];
}
export declare class SendBulkNotificationDto {
    title: string;
    body: string;
    channel?: string;
    target_type: string;
    target_role?: string;
    target_class_id?: number;
    target_section_id?: number;
}
export declare class ListNotificationsQueryDto {
    limit?: number;
    unread?: string;
}
export declare class RegisterTokenDto {
    token: string;
    platform?: string;
}
