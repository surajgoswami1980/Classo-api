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
exports.StaffAttendanceEntity = void 0;
const typeorm_1 = require("typeorm");
let StaffAttendanceEntity = class StaffAttendanceEntity {
};
exports.StaffAttendanceEntity = StaffAttendanceEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], StaffAttendanceEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], StaffAttendanceEntity.prototype, "school_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], StaffAttendanceEntity.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", String)
], StaffAttendanceEntity.prototype, "date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], StaffAttendanceEntity.prototype, "check_in_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamp', nullable: true }),
    __metadata("design:type", Date)
], StaffAttendanceEntity.prototype, "check_out_time", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['present', 'absent', 'leave', 'half_day', 'late'] }),
    __metadata("design:type", String)
], StaffAttendanceEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Number)
], StaffAttendanceEntity.prototype, "marked_by", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], StaffAttendanceEntity.prototype, "remarks", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], StaffAttendanceEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], StaffAttendanceEntity.prototype, "updated_at", void 0);
exports.StaffAttendanceEntity = StaffAttendanceEntity = __decorate([
    (0, typeorm_1.Entity)('staff_attendance'),
    (0, typeorm_1.Index)('idx_school_date', ['school_id', 'date']),
    (0, typeorm_1.Unique)('uk_staff_date', ['user_id', 'date'])
], StaffAttendanceEntity);
//# sourceMappingURL=staff-attendance.entity.js.map