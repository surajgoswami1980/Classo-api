export declare class NotificationEntity {
    id: number;
    school_id: number;
    title: string;
    body: string;
    channel: string;
    target_type: string;
    target_role: string;
    target_class_id: number;
    target_section_id: number;
    target_user_ids: number[];
    sent_by: number;
    status: string;
    sent_at: Date;
    created_at: Date;
}
