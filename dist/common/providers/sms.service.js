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
var SmsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let SmsService = SmsService_1 = class SmsService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(SmsService_1.name);
    }
    get provider() {
        return (this.configService.get('SMS_PROVIDER') || 'log').toLowerCase();
    }
    async send(phone, message) {
        const normalized = this.normalize(phone);
        if (this.provider === 'log' || !this.configService.get('SMS_API_URL')) {
            this.logger.warn(`SMS gateway not configured — would have sent to ${normalized}: "${message}"`);
            return false;
        }
        return this.deliver(normalized, message);
    }
    async deliver(phone, message) {
        try {
            const urlTemplate = this.configService.get('SMS_API_URL');
            const apiKey = this.configService.get('SMS_API_KEY') || '';
            const senderId = this.configService.get('SMS_SENDER_ID') || '';
            const url = urlTemplate
                .replace('{phone}', encodeURIComponent(phone))
                .replace('{message}', encodeURIComponent(message))
                .replace('{key}', encodeURIComponent(apiKey))
                .replace('{sender}', encodeURIComponent(senderId));
            const res = await fetch(url, { method: 'GET' });
            if (!res.ok) {
                this.logger.error(`SMS send failed (${res.status}) to ${phone}`);
                return false;
            }
            return true;
        }
        catch (e) {
            this.logger.error(`SMS send error to ${phone}: ${e.message}`);
            return false;
        }
    }
    normalize(phone) {
        const trimmed = (phone || '').trim();
        const plus = trimmed.startsWith('+');
        const digits = trimmed.replace(/[^\d]/g, '');
        return plus ? `+${digits}` : digits;
    }
};
exports.SmsService = SmsService;
exports.SmsService = SmsService = SmsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SmsService);
//# sourceMappingURL=sms.service.js.map