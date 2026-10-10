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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const notification_entity_1 = require("../../entities/notification.entity");
const notification_read_entity_1 = require("../../entities/notification-read.entity");
const device_token_entity_1 = require("../../entities/device-token.entity");
const push_queue_service_1 = require("./push-queue.service");
let NotificationService = class NotificationService {
    constructor(notifRepo, readRepo, tokenRepo, pushQueue) {
        this.notifRepo = notifRepo;
        this.readRepo = readRepo;
        this.tokenRepo = tokenRepo;
        this.pushQueue = pushQueue;
    }
    async registerToken(schoolId, userId, dto) {
        if (!dto?.token)
            throw new common_1.BadRequestException('token is required');
        const existing = await this.tokenRepo.findOne({ where: { token: dto.token } });
        if (existing) {
            existing.user_id = userId;
            existing.school_id = schoolId;
            existing.platform = dto.platform || existing.platform || 'android';
            existing.is_active = true;
            existing.last_used_at = new Date();
            await this.tokenRepo.save(existing);
            return { message: 'Token updated' };
        }
        await this.tokenRepo.save(this.tokenRepo.create({
            school_id: schoolId,
            user_id: userId,
            token: dto.token,
            platform: dto.platform || 'android',
            is_active: true,
            last_used_at: new Date(),
        }));
        return { message: 'Token registered' };
    }
    async unregisterToken(userId, token) {
        if (!token)
            throw new common_1.BadRequestException('token is required');
        await this.tokenRepo.update({ token, user_id: userId }, { is_active: false });
        return { message: 'Token removed' };
    }
    async sendNotification(schoolId, sentBy, data) {
        const notification = this.notifRepo.create({
            school_id: schoolId,
            title: data.title,
            body: data.body,
            channel: data.channel || 'all',
            target_type: data.target_type,
            target_role: data.target_role || null,
            target_class_id: data.target_class_id || null,
            target_section_id: data.target_section_id || null,
            target_user_ids: data.target_user_ids || null,
            sent_by: sentBy,
            status: 'sent',
            sent_at: new Date(),
        });
        const saved = await this.notifRepo.save(notification);
        try {
            await this.pushQueue.enqueue({ notification_id: saved.id, school_id: schoolId });
        }
        catch {
        }
        return {
            id: saved.id,
            message: 'Notification sent successfully',
        };
    }
    async listNotifications(schoolId, userRole, userId, query) {
        const limit = query?.limit || 50;
        const qb = this.notifRepo
            .createQueryBuilder('n')
            .where('n.school_id = :schoolId', { schoolId })
            .andWhere('n.status = :status', { status: 'sent' })
            .andWhere('(n.target_type = :all OR (n.target_type = :role AND n.target_role = :userRole))', { all: 'all', role: 'role', userRole })
            .orderBy('n.created_at', 'DESC')
            .take(limit);
        const notifications = await qb.getMany();
        const readIds = notifications.length
            ? new Set((await this.readRepo.find({
                where: { user_id: userId, notification_id: (0, typeorm_2.In)(notifications.map((n) => n.id)) },
            })).map((r) => r.notification_id))
            : new Set();
        const mapped = notifications
            .map((n) => ({
            id: n.id,
            title: n.title,
            body: n.body,
            channel: n.channel,
            target_type: n.target_type,
            sent_at: n.sent_at,
            created_at: n.created_at,
            is_read: readIds.has(n.id),
        }))
            .filter((n) => (query?.unread === 'true' ? !n.is_read : true));
        return {
            notifications: mapped,
            total: mapped.length,
            unread_count: notifications.length - readIds.size,
        };
    }
    async markAsRead(schoolId, notificationId, userId) {
        const notification = await this.notifRepo.findOne({ where: { id: notificationId, school_id: schoolId } });
        if (!notification)
            throw new common_1.NotFoundException('Notification not found');
        const existing = await this.readRepo.findOne({ where: { notification_id: notificationId, user_id: userId } });
        if (existing)
            return { message: 'Already marked as read' };
        await this.readRepo.save(this.readRepo.create({
            school_id: schoolId,
            notification_id: notificationId,
            user_id: userId,
            read_at: new Date(),
        }));
        return { message: 'Marked as read' };
    }
    async sendBulkNotification(schoolId, sentBy, data) {
        return this.sendNotification(schoolId, sentBy, data);
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(notification_entity_1.NotificationEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(notification_read_entity_1.NotificationReadEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(device_token_entity_1.DeviceTokenEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        push_queue_service_1.PushQueueService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map