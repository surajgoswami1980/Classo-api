"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var OtpService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = require("crypto");
const redis_service_1 = require("./redis.service");
const email_service_1 = require("./email.service");
const sms_service_1 = require("./sms.service");
const OTP_TTL_SECONDS = 300;
const RESEND_COOLDOWN_SECONDS = 30;
const MAX_ATTEMPTS = 5;
const MAX_SENDS_PER_HOUR = 8;
let OtpService = OtpService_1 = class OtpService {
    constructor(redis, email, sms, config) {
        this.redis = redis;
        this.email = email;
        this.sms = sms;
        this.config = config;
        this.logger = new common_1.Logger(OtpService_1.name);
    }
    codeKey(channel, destination) {
        return `otp:code:${channel}:${destination.toLowerCase()}`;
    }
    cooldownKey(channel, destination) {
        return `otp:cooldown:${channel}:${destination.toLowerCase()}`;
    }
    rateKey(channel, destination) {
        return `otp:rate:${channel}:${destination.toLowerCase()}`;
    }
    hash(code) {
        return crypto.createHash('sha256').update(code).digest('hex');
    }
    generateCode() {
        return crypto.randomInt(100000, 1000000).toString();
    }
    get superOtp() {
        const v = (this.config.get('SUPER_OTP') || '').toString().trim();
        return v.length > 0 ? v : null;
    }
    get devEcho() {
        const explicit = this.config.get('OTP_DEV_ECHO');
        if (explicit !== undefined)
            return String(explicit) === 'true';
        return (this.config.get('NODE_ENV') || 'development') !== 'production';
    }
    async request(channel, destination, purpose, recipientName) {
        if (!destination) {
            throw new common_1.BadRequestException('A destination (email or mobile) is required.');
        }
        const onCooldown = await this.safe(() => this.redis.exists(this.cooldownKey(channel, destination)));
        if (onCooldown) {
            throw new common_1.BadRequestException(`Please wait before requesting another code.`);
        }
        const rateKey = this.rateKey(channel, destination);
        const sends = await this.safe(() => this.redis.incr(rateKey));
        if (sends === 1) {
            await this.safe(() => this.redis.expire(rateKey, 3600));
        }
        if (sends && sends > MAX_SENDS_PER_HOUR) {
            throw new common_1.BadRequestException('Too many OTP requests. Try again later.');
        }
        const code = this.generateCode();
        const payload = JSON.stringify({ hash: this.hash(code), attempts: 0, purpose });
        await this.safe(() => this.redis.set(this.codeKey(channel, destination), payload, OTP_TTL_SECONDS));
        await this.safe(() => this.redis.set(this.cooldownKey(channel, destination), '1', RESEND_COOLDOWN_SECONDS));
        const message = `Your Quilo ${purpose === 'login' ? 'login' : 'verification'} OTP is ${code}. It is valid for 5 minutes. Do not share it with anyone.`;
        let sent = false;
        if (channel === 'email') {
            await this.email.send(destination, 'Your Quilo OTP', `<p>Hi ${recipientName || 'there'},</p><p>Your One-Time Password is:</p><h2 style="letter-spacing:4px">${code}</h2><p>It is valid for 5 minutes. Do not share it with anyone.</p>`);
            sent = true;
        }
        else {
            sent = await this.sms.send(destination, message);
        }
        if (this.devEcho) {
            this.logger.warn(`[DEV] OTP for ${channel} ${destination}: ${code}`);
        }
        return {
            sent,
            cooldown: RESEND_COOLDOWN_SECONDS,
            ...(this.devEcho ? { dev_otp: code } : {}),
        };
    }
    async verify(channel, destination, code) {
        if (!code)
            throw new common_1.BadRequestException('Enter the OTP.');
        const superOtp = this.superOtp;
        if (superOtp && code === superOtp) {
            await this.safe(() => this.redis.del(this.codeKey(channel, destination)));
            return true;
        }
        const key = this.codeKey(channel, destination);
        const raw = await this.safe(() => this.redis.get(key));
        if (!raw) {
            throw new common_1.BadRequestException('OTP expired or not requested. Please request a new one.');
        }
        let data;
        try {
            data = JSON.parse(raw);
        }
        catch {
            await this.safe(() => this.redis.del(key));
            throw new common_1.BadRequestException('OTP is invalid. Please request a new one.');
        }
        if (data.attempts >= MAX_ATTEMPTS) {
            await this.safe(() => this.redis.del(key));
            throw new common_1.BadRequestException('Too many incorrect attempts. Please request a new OTP.');
        }
        if (this.hash(code) !== data.hash) {
            data.attempts += 1;
            await this.safe(() => this.redis.set(key, JSON.stringify(data), OTP_TTL_SECONDS));
            throw new common_1.BadRequestException(`Incorrect OTP. ${MAX_ATTEMPTS - data.attempts} attempt(s) left.`);
        }
        await this.safe(() => this.redis.del(key));
        return true;
    }
    async safe(fn) {
        try {
            return await fn();
        }
        catch (e) {
            this.logger.error(`OTP Redis op failed: ${e?.message}`);
            return undefined;
        }
    }
};
exports.OtpService = OtpService;
exports.OtpService = OtpService = OtpService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [redis_service_1.RedisService,
        email_service_1.EmailService,
        sms_service_1.SmsService,
        config_1.ConfigService])
], OtpService);
//# sourceMappingURL=otp.service.js.map