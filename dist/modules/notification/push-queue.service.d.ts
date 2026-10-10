import { ConfigService } from '@nestjs/config';
export declare const PUSH_QUEUE_KEY = "queue:push_notifications";
export interface PushJob {
    notification_id: number;
    school_id: number;
}
export declare class PushQueueService {
    private config;
    private readonly logger;
    private client;
    constructor(config: ConfigService);
    private getClient;
    enqueue(job: PushJob): Promise<void>;
}
