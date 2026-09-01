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
exports.AttendanceReportDto = exports.GetAttendanceDto = exports.MarkStaffAttendanceDto = exports.StaffAttendanceItemDto = exports.MarkStudentAttendanceDto = exports.StudentAttendanceItemDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const swagger_1 = require("@nestjs/swagger");
class StudentAttendanceItemDto {
}
exports.StudentAttendanceItemDto = StudentAttendanceItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], StudentAttendanceItemDto.prototype, "student_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['present', 'absent', 'late', 'half_day'] }),
    (0, class_validator_1.IsEnum)(['present', 'absent', 'late', 'half_day']),
    __metadata("design:type", String)
], StudentAttendanceItemDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StudentAttendanceItemDto.prototype, "remarks", void 0);
class MarkStudentAttendanceDto {
}
exports.MarkStudentAttendanceDto = MarkStudentAttendanceDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MarkStudentAttendanceDto.prototype, "class_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], MarkStudentAttendanceDto.prototype, "section_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date in YYYY-MM-DD format' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkStudentAttendanceDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [StudentAttendanceItemDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => StudentAttendanceItemDto),
    __metadata("design:type", Array)
], MarkStudentAttendanceDto.prototype, "attendance", void 0);
class StaffAttendanceItemDto {
}
exports.StaffAttendanceItemDto = StaffAttendanceItemDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], StaffAttendanceItemDto.prototype, "user_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['present', 'absent', 'leave', 'half_day', 'late'] }),
    (0, class_validator_1.IsEnum)(['present', 'absent', 'leave', 'half_day', 'late']),
    __metadata("design:type", String)
], StaffAttendanceItemDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StaffAttendanceItemDto.prototype, "check_in_time", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StaffAttendanceItemDto.prototype, "check_out_time", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StaffAttendanceItemDto.prototype, "remarks", void 0);
class MarkStaffAttendanceDto {
}
exports.MarkStaffAttendanceDto = MarkStaffAttendanceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Date in YYYY-MM-DD format' }),
    (0, class_validator_1.IsNotEmpty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkStaffAttendanceDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [StaffAttendanceItemDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => StaffAttendanceItemDto),
    __metadata("design:type", Array)
], MarkStaffAttendanceDto.prototype, "attendance", void 0);
class GetAttendanceDto {
}
exports.GetAttendanceDto = GetAttendanceDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GetAttendanceDto.prototype, "class_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], GetAttendanceDto.prototype, "section_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetAttendanceDto.prototype, "date", void 0);
class AttendanceReportDto {
}
exports.AttendanceReportDto = AttendanceReportDto;
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AttendanceReportDto.prototype, "class_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AttendanceReportDto.prototype, "section_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AttendanceReportDto.prototype, "student_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AttendanceReportDto.prototype, "from_date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AttendanceReportDto.prototype, "to_date", void 0);
//# sourceMappingURL=attendance.dto.js.map