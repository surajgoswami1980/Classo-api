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
var PushQueueService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushQueueService = exports.PUSH_QUEUE_KEY = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
exports.PUSH_QUEUE_KEY = 'queue:push_notifications';
let PushQueueService = PushQueueService_1 = class PushQueueService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(PushQueueService_1.name);
        this.client = null;
    }
    getClient() {
        if (!this.client) {
            this.client = new ioredis_1.default({
                host: this.config.get('redis.host') || this.config.get('REDIS_HOST') || '127.0.0.1',
                port: parseInt(this.config.get('redis.port') || this.config.get('REDIS_PORT') || '6379', 10),
                password: this.config.get('redis.password') || this.config.get('REDIS_PASSWORD') || undefined,
                maxRetriesPerRequest: 2,
                retryStrategy: (times) => Math.min(times * 100, 2000),
            });
            this.client.on('error', (e) => this.logger.error(`Push queue Redis error: ${e.message}`));
        }
        return this.client;
    }
    async enqueue(job) {
        await this.getClient().rpush(exports.PUSH_QUEUE_KEY, JSON.stringify(job));
    }
};
exports.PushQueueService = PushQueueService;
exports.PushQueueService = PushQueueService = PushQueueService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PushQueueService);
//# sourceMappingURL=push-queue.service.js.map