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
exports.LibraryBookIssueEntity = void 0;
const typeorm_1 = require("typeorm");
let LibraryBookIssueEntity = class LibraryBookIssueEntity {
};
exports.LibraryBookIssueEntity = LibraryBookIssueEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], LibraryBookIssueEntity.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], LibraryBookIssueEntity.prototype, "school_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], LibraryBookIssueEntity.prototype, "book_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], LibraryBookIssueEntity.prototype, "issued_to_user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], LibraryBookIssueEntity.prototype, "issue_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date' }),
    __metadata("design:type", Date)
], LibraryBookIssueEntity.prototype, "due_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'date', nullable: true }),
    __metadata("design:type", Date)
], LibraryBookIssueEntity.prototype, "return_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 8, scale: 2, default: 0 }),
    __metadata("design:type", Number)
], LibraryBookIssueEntity.prototype, "fine_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'tinyint', default: 0 }),
    __metadata("design:type", Number)
], LibraryBookIssueEntity.prototype, "fine_paid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['issued', 'returned', 'overdue'], default: 'issued' }),
    __metadata("design:type", String)
], LibraryBookIssueEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], LibraryBookIssueEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], LibraryBookIssueEntity.prototype, "updated_at", void 0);
exports.LibraryBookIssueEntity = LibraryBookIssueEntity = __decorate([
    (0, typeorm_1.Entity)('library_book_issues'),
    (0, typeorm_1.Index)('idx_school_book', ['school_id', 'book_id']),
    (0, typeorm_1.Index)('idx_school_status', ['school_id', 'status'])
], LibraryBookIssueEntity);
//# sourceMappingURL=library-book-issue.entity.js.map