import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';
import { EmailService } from './email.service';
import { SmsService } from './sms.service';
export type OtpChannel = 'email' | 'mobile';
export type OtpPurpose = 'login' | 'verify';
export declare class OtpService {
    private readonly redis;
    private readonly email;
    private readonly sms;
    private readonly config;
    private readonly logger;
    constructor(redis: RedisService, email: EmailService, sms: SmsService, config: ConfigService);
    private codeKey;
    private cooldownKey;
    private rateKey;
    private hash;
    private generateCode;
    private get superOtp();
    private get devEcho();
    request(channel: OtpChannel, destination: string, purpose: OtpPurpose, recipientName?: string): Promise<{
        sent: boolean;
        cooldown: number;
        dev_otp?: string;
    }>;
    verify(channel: OtpChannel, destination: string, code: string): Promise<boolean>;
    private safe;
}
