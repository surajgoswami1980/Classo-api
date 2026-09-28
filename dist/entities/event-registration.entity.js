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
exports.EventRegistrationEntity = void 0;
const typeorm_1 = require("typeorm");
let EventRegistrationEntity = class EventRegistrationEntity {
};
exports.EventRegistrationEntity = EventRegistrationEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], EventRegistrationEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], EventRegistrationEntity.prototype, "school_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], EventRegistrationEntity.prototype, "event_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], EventRegistrationEntity.prototype, "student_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], EventRegistrationEntity.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['not_required', 'pending', 'paid', 'failed'], default: 'not_required' }),
    __metadata("design:type", String)
], EventRegistrationEntity.prototype, "payment_status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 10, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], EventRegistrationEntity.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], EventRegistrationEntity.prototype, "payment_transaction_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['registered', 'cancelled', 'attended'], default: 'registered' }),
    __metadata("design:type", String)
], EventRegistrationEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], EventRegistrationEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], EventRegistrationEntity.prototype, "updated_at", void 0);
exports.EventRegistrationEntity = EventRegistrationEntity = __decorate([
    (0, typeorm_1.Entity)('event_registrations'),
    (0, typeorm_1.Index)('idx_school_event', ['school_id', 'event_id'])
], EventRegistrationEntity);
//# sourceMappingURL=event-registration.entity.js.map