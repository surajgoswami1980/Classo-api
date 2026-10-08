import { ConfigService } from '@nestjs/config';
export declare class SmsService {
    private configService;
    private readonly logger;
    constructor(configService: ConfigService);
    private get provider();
    send(phone: string, message: string): Promise<boolean>;
    private deliver;
    private normalize;
}
