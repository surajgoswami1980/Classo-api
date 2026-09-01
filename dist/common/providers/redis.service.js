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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
let RedisService = class RedisService {
    constructor(configService) {
        this.configService = configService;
    }
    onModuleInit() {
        this.client = new ioredis_1.default({
            host: this.configService.get('redis.host'),
            port: this.configService.get('redis.port'),
            password: this.configService.get('redis.password'),
            retryStrategy: (times) => Math.min(times * 50, 2000),
        });
        this.client.on('error', (err) => {
            console.error('Redis connection error:', err.message);
        });
    }
    onModuleDestroy() {
        this.client?.disconnect();
    }
    async get(key) {
        return this.client.get(key);
    }
    async set(key, value, ttlSeconds) {
        if (ttlSeconds) {
            await this.client.set(key, value, 'EX', ttlSeconds);
        }
        else {
            await this.client.set(key, value);
        }
    }
    async del(key) {
        await this.client.del(key);
    }
    async delPattern(pattern) {
        let deleted = 0;
        let cursor = '0';
        do {
            const [newCursor, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 500);
            cursor = newCursor;
            if (keys.length > 0) {
                for (const key of keys) {
                    await this.client.del(key);
                    deleted++;
                }
            }
        } while (cursor !== '0');
        return deleted;
    }
    async getJson(key) {
        const data = await this.get(key);
        return data ? JSON.parse(data) : null;
    }
    async setJson(key, value, ttlSeconds) {
        await this.set(key, JSON.stringify(value), ttlSeconds);
    }
    async exists(key) {
        return (await this.client.exists(key)) === 1;
    }
    async incr(key) {
        return this.client.incr(key);
    }
    async expire(key, ttlSeconds) {
        await this.client.expire(key, ttlSeconds);
    }
    getClient() {
        return this.client;
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map