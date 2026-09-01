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
exports.PasswordResetRequestEntity = void 0;
const typeorm_1 = require("typeorm");
let PasswordResetRequestEntity = class PasswordResetRequestEntity {
};
exports.PasswordResetRequestEntity = PasswordResetRequestEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], PasswordResetRequestEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PasswordResetRequestEntity.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 64 }),
    __metadata("design:type", String)
], PasswordResetRequestEntity.prototype, "token_hash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp' }),
    __metadata("design:type", Date)
], PasswordResetRequestEntity.prototype, "expires_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], PasswordResetRequestEntity.prototype, "used_at", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PasswordResetRequestEntity.prototype, "created_at", void 0);
exports.PasswordResetRequestEntity = PasswordResetRequestEntity = __decorate([
    (0, typeorm_1.Entity)('password_reset_requests'),
    (0, typeorm_1.Index)('idx_user_expiry', ['user_id', 'expires_at'])
], PasswordResetRequestEntity);
//# sourceMappingURL=password-reset-request.entity.js.map