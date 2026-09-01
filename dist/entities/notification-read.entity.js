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
exports.NotificationReadEntity = void 0;
const typeorm_1 = require("typeorm");
let NotificationReadEntity = class NotificationReadEntity {
};
exports.NotificationReadEntity = NotificationReadEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], NotificationReadEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], NotificationReadEntity.prototype, "school_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], NotificationReadEntity.prototype, "notification_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], NotificationReadEntity.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], NotificationReadEntity.prototype, "read_at", void 0);
exports.NotificationReadEntity = NotificationReadEntity = __decorate([
    (0, typeorm_1.Entity)('notification_reads'),
    (0, typeorm_1.Index)('idx_school_user', ['school_id', 'user_id']),
    (0, typeorm_1.Unique)('uk_notification_user', ['notification_id', 'user_id'])
], NotificationReadEntity);
//# sourceMappingURL=notification-read.entity.js.map