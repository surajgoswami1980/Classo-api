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
exports.StudentMarksEntity = void 0;
const typeorm_1 = require("typeorm");
let StudentMarksEntity = class StudentMarksEntity {
};
exports.StudentMarksEntity = StudentMarksEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], StudentMarksEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], StudentMarksEntity.prototype, "school_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], StudentMarksEntity.prototype, "exam_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], StudentMarksEntity.prototype, "exam_subject_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], StudentMarksEntity.prototype, "student_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 2 }),
    __metadata("design:type", Number)
], StudentMarksEntity.prototype, "marks_obtained", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 5, nullable: true }),
    __metadata("design:type", String)
], StudentMarksEntity.prototype, "grade", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255, nullable: true }),
    __metadata("design:type", String)
], StudentMarksEntity.prototype, "remarks", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], StudentMarksEntity.prototype, "entered_by", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], StudentMarksEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], StudentMarksEntity.prototype, "updated_at", void 0);
exports.StudentMarksEntity = StudentMarksEntity = __decorate([
    (0, typeorm_1.Entity)('student_marks'),
    (0, typeorm_1.Index)('idx_school_exam', ['school_id', 'exam_id']),
    (0, typeorm_1.Unique)('uk_student_exam_subject', ['student_id', 'exam_subject_id'])
], StudentMarksEntity);
//# sourceMappingURL=student-marks.entity.js.map