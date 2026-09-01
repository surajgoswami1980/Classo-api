export declare class PasswordResetRequestEntity {
    id: number;
    user_id: number;
    token_hash: string;
    expires_at: Date;
    used_at: Date;
    created_at: Date;
}
