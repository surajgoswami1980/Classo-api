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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var PushWorkerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushWorkerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ioredis_1 = require("ioredis");
const notification_entity_1 = require("../../entities/notification.entity");
const device_token_entity_1 = require("../../entities/device-token.entity");
const firebase_service_1 = require("./firebase.service");
const push_queue_service_1 = require("./push-queue.service");
let PushWorkerService = PushWorkerService_1 = class PushWorkerService {
    constructor(config, firebase, notifRepo, tokenRepo) {
        this.config = config;
        this.firebase = firebase;
        this.notifRepo = notifRepo;
        this.tokenRepo = tokenRepo;
        this.logger = new common_1.Logger(PushWorkerService_1.name);
        this.client = null;
        this.running = false;
    }
    onModuleInit() {
        if (String(this.config.get('PUSH_WORKER_ENABLED') ?? 'true') === 'false') {
            this.logger.warn('Push worker disabled (PUSH_WORKER_ENABLED=false).');
            return;
        }
        this.client = new ioredis_1.default({
            host: this.config.get('redis.host') || this.config.get('REDIS_HOST') || '127.0.0.1',
            port: parseInt(this.config.get('redis.port') || this.config.get('REDIS_PORT') || '6379', 10),
            password: this.config.get('redis.password') || this.config.get('REDIS_PASSWORD') || undefined,
            maxRetriesPerRequest: null,
            retryStrategy: (times) => Math.min(times * 200, 5000),
        });
        this.client.on('error', (e) => this.logger.error(`Worker Redis error: ${e.message}`));
        this.running = true;
        this.loop();
        this.logger.log('Push notification worker started.');
    }
    onModuleDestroy() {
        this.running = false;
        this.client?.disconnect();
    }
    async loop() {
        while (this.running && this.client) {
            try {
                const res = await this.client.blpop(push_queue_service_1.PUSH_QUEUE_KEY, 5);
                if (!res)
                    continue;
                const job = JSON.parse(res[1]);
                await this.process(job).catch((e) => this.logger.error(`Job failed: ${e.message}`));
            }
            catch (e) {
                if (this.running) {
                    this.logger.error(`Worker loop error: ${e.message}`);
                    await new Promise((r) => setTimeout(r, 1000));
                }
            }
        }
    }
    async process(job) {
        const notif = await this.notifRepo.findOne({ where: { id: job.notification_id } });
        if (!notif)
            return;
        const userIds = await this.resolveRecipients(notif);
        if (userIds.length === 0) {
            await this.notifRepo.update(notif.id, { status: 'sent', sent_at: new Date() });
            return;
        }
        const now = new Date();
        const values = userIds.map((uid) => [notif.school_id, notif.id, uid, 'pending', null, now]);
        try {
            await this.notifRepo.query(`INSERT INTO notification_dispatches (school_id, notification_id, user_id, push_status, failure_reason, created_at) VALUES ${values
                .map(() => '(?,?,?,?,?,?)')
                .join(',')}`, values.flat());
        }
        catch (e) {
            this.logger.warn(`dispatch insert warning: ${e.message}`);
        }
        if (notif.channel === 'push' || notif.channel === 'all') {
            const tokenRows = await this.tokenRepo.find({
                where: userIds.map((uid) => ({ user_id: uid, is_active: true })),
            });
            const tokens = tokenRows.map((t) => t.token);
            if (tokens.length > 0) {
                const result = await this.firebase.sendToTokens(tokens, notif.title, notif.body, {
                    notification_id: String(notif.id),
                    type: 'notification',
                });
                if (result.invalidTokens.length) {
                    await this.tokenRepo.update({ token: result.invalidTokens }, { is_active: false }).catch(() => { });
                    await this.notifRepo.query(`UPDATE device_tokens SET is_active = 0 WHERE token IN (${result.invalidTokens.map(() => '?').join(',')})`, result.invalidTokens).catch(() => { });
                }
                await this.notifRepo.query(`UPDATE notification_dispatches SET push_status = 'sent' WHERE notification_id = ? AND user_id IN (${userIds.map(() => '?').join(',')})`, [notif.id, ...userIds]).catch(() => { });
                this.logger.log(`Notification ${notif.id}: ${userIds.length} recipients, ${tokens.length} tokens, push ok=${result.successCount} fail=${result.failureCount}`);
            }
            else {
                await this.notifRepo.query(`UPDATE notification_dispatches SET push_status = 'skipped', failure_reason = 'no active token' WHERE notification_id = ?`, [notif.id]).catch(() => { });
            }
        }
        await this.notifRepo.update(notif.id, { status: 'sent', sent_at: new Date() });
    }
    async resolveRecipients(n) {
        const schoolId = n.school_id;
        if (n.target_type === 'individual' && Array.isArray(n.target_user_ids) && n.target_user_ids.length) {
            return n.target_user_ids.map((x) => Number(x));
        }
        if (n.target_type === 'section' && n.target_section_id) {
            const rows = await this.notifRepo.query(`SELECT u.id FROM users u JOIN students s ON s.user_id = u.id
         WHERE u.school_id = ? AND s.section_id = ? AND u.is_active = 1 AND u.deleted_at IS NULL`, [schoolId, n.target_section_id]);
            return rows.map((r) => r.id);
        }
        if (n.target_type === 'class' && n.target_class_id) {
            const rows = await this.notifRepo.query(`SELECT u.id FROM users u JOIN students s ON s.user_id = u.id
         WHERE u.school_id = ? AND s.class_id = ? AND u.is_active = 1 AND u.deleted_at IS NULL`, [schoolId, n.target_class_id]);
            return rows.map((r) => r.id);
        }
        if (n.target_type === 'role' && n.target_role) {
            const rows = await this.notifRepo.query(`SELECT DISTINCT u.id FROM users u
         JOIN model_has_roles mhr ON mhr.model_id = u.id AND mhr.model_type = 'App\\\\Models\\\\User'
         JOIN roles r ON r.id = mhr.role_id
         WHERE u.school_id = ? AND u.is_active = 1 AND u.deleted_at IS NULL AND r.name = ?`, [schoolId, n.target_role]);
            return rows.map((r) => r.id);
        }
        const rows = await this.notifRepo.query(`SELECT id FROM users WHERE school_id = ? AND is_active = 1 AND deleted_at IS NULL`, [schoolId]);
        return rows.map((r) => r.id);
    }
};
exports.PushWorkerService = PushWorkerService;
exports.PushWorkerService = PushWorkerService = PushWorkerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, typeorm_1.InjectRepository)(notification_entity_1.NotificationEntity)),
    __param(3, (0, typeorm_1.InjectRepository)(device_token_entity_1.DeviceTokenEntity)),
    __metadata("design:paramtypes", [config_1.ConfigService,
        firebase_service_1.FirebaseService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], PushWorkerService);
//# sourceMappingURL=push-worker.service.js.map