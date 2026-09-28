// Plain DTO classes (no class-validator decorators) — consistent with the
// rest of the codebase and the global ValidationPipe config in main.ts, which
// intentionally keeps whitelist/forbidNonWhitelisted OFF. `transform: true`
// still applies implicit type coercion to the typed properties below.

export class SendNotificationDto {
  title: string;
  body: string;
  channel?: string;
  target_type: string;
  target_role?: string;
  target_class_id?: number;
  target_section_id?: number;
  target_user_ids?: number[];
}

export class SendBulkNotificationDto {
  title: string;
  body: string;
  channel?: string;
  target_type: string;
  target_role?: string;
  target_class_id?: number;
  target_section_id?: number;
}

export class ListNotificationsQueryDto {
  limit?: number;
  unread?: string;
}
