import { ConfigService } from '@nestjs/config';
export interface FcmSendResult {
    successCount: number;
    failureCount: number;
    invalidTokens: string[];
}
export declare class FirebaseService {
    private config;
    private readonly logger;
    private app;
    private messaging;
    private initialized;
    constructor(config: ConfigService);
    private init;
    get isLive(): boolean;
    sendToTokens(tokens: string[], title: string, body: string, data?: Record<string, string>): Promise<FcmSendResult>;
}
