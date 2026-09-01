import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private configService;
    private readonly logger;
    private client;
    constructor(configService: ConfigService);
    send(to: string, subject: string, htmlBody: string): Promise<void>;
}
