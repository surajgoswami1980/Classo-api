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
exports.NotificationEntity = void 0;
const typeorm_1 = require("typeorm");
let NotificationEntity = class NotificationEntity {
};
exports.NotificationEntity = NotificationEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], NotificationEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], NotificationEntity.prototype, "school_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], NotificationEntity.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text' }),
    __metadata("design:type", String)
], NotificationEntity.prototype, "body", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['push', 'email', 'sms', 'all'], default: 'all' }),
    __metadata("design:type", String)
], NotificationEntity.prototype, "channel", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['all', 'role', 'class', 'section', 'individual'] }),
    __metadata("design:type", String)
], NotificationEntity.prototype, "target_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['teacher', 'student', 'parent', 'staff'], nullable: true }),
    __metadata("design:type", String)
], NotificationEntity.prototype, "target_role", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], NotificationEntity.prototype, "target_class_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], NotificationEntity.prototype, "target_section_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'json', nullable: true }),
    __metadata("design:type", Array)
], NotificationEntity.prototype, "target_user_ids", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], NotificationEntity.prototype, "sent_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['queued', 'processing', 'sent', 'failed'], default: 'queued' }),
    __metadata("design:type", String)
], NotificationEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], NotificationEntity.prototype, "sent_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], NotificationEntity.prototype, "created_at", void 0);
exports.NotificationEntity = NotificationEntity = __decorate([
    (0, typeorm_1.Entity)('notifications'),
    (0, typeorm_1.Index)('idx_school_status', ['school_id', 'status'])
], NotificationEntity);
//# sourceMappingURL=notification.entity.js.map