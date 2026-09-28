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
exports.HostelAllocationEntity = void 0;
const typeorm_1 = require("typeorm");
let HostelAllocationEntity = class HostelAllocationEntity {
};
exports.HostelAllocationEntity = HostelAllocationEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], HostelAllocationEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], HostelAllocationEntity.prototype, "school_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], HostelAllocationEntity.prototype, "room_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], HostelAllocationEntity.prototype, "student_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], HostelAllocationEntity.prototype, "allocated_from", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], HostelAllocationEntity.prototype, "vacated_on", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['active', 'vacated'], default: 'active' }),
    __metadata("design:type", String)
], HostelAllocationEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], HostelAllocationEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], HostelAllocationEntity.prototype, "updated_at", void 0);
exports.HostelAllocationEntity = HostelAllocationEntity = __decorate([
    (0, typeorm_1.Entity)('hostel_allocations'),
    (0, typeorm_1.Index)('idx_school_room', ['school_id', 'room_id']),
    (0, typeorm_1.Index)('idx_school_student', ['school_id', 'student_id'])
], HostelAllocationEntity);
//# sourceMappingURL=hostel-allocation.entity.js.map