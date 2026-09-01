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
exports.LibraryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const library_book_entity_1 = require("../../entities/library-book.entity");
const library_book_issue_entity_1 = require("../../entities/library-book-issue.entity");
const school_entity_1 = require("../../entities/school.entity");
const DEFAULT_FINE_PER_DAY = 2;
let LibraryService = class LibraryService {
    constructor(bookRepo, issueRepo, schoolRepo) {
        this.bookRepo = bookRepo;
        this.issueRepo = issueRepo;
        this.schoolRepo = schoolRepo;
    }
    async listBooks(schoolId, query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 20;
        const qb = this.bookRepo.createQueryBuilder('b').where('b.school_id = :schoolId', { schoolId });
        if (query.category)
            qb.andWhere('b.category = :category', { category: query.category });
        if (query.search) {
            qb.andWhere('(b.title LIKE :search OR b.author LIKE :search OR b.isbn LIKE :search)', {
                search: `%${query.search}%`,
            });
        }
        const total = await qb.getCount();
        const data = await qb.orderBy('b.title', 'ASC').skip((page - 1) * limit).take(limit).getMany();
        return { data, total, page, limit, total_pages: Math.ceil(total / limit) };
    }
    async createBook(schoolId, dto) {
        const totalCopies = dto.total_copies ?? 1;
        const book = this.bookRepo.create({
            school_id: schoolId,
            title: dto.title,
            author: dto.author,
            isbn: dto.isbn,
            category: dto.category,
            publisher: dto.publisher,
            total_copies: totalCopies,
            available_copies: totalCopies,
            rack_location: dto.rack_location,
        });
        return this.bookRepo.save(book);
    }
    async updateBook(schoolId, id, dto) {
        const book = await this.bookRepo.findOne({ where: { id, school_id: schoolId } });
        if (!book)
            throw new common_1.NotFoundException('Book not found');
        if (dto.total_copies !== undefined) {
            const issuedCount = book.total_copies - book.available_copies;
            if (dto.total_copies < issuedCount) {
                throw new common_1.BadRequestException(`Cannot reduce total copies below ${issuedCount} (currently issued)`);
            }
            book.available_copies += dto.total_copies - book.total_copies;
            book.total_copies = dto.total_copies;
        }
        Object.assign(book, {
            ...(dto.title !== undefined && { title: dto.title }),
            ...(dto.author !== undefined && { author: dto.author }),
            ...(dto.isbn !== undefined && { isbn: dto.isbn }),
            ...(dto.category !== undefined && { category: dto.category }),
            ...(dto.publisher !== undefined && { publisher: dto.publisher }),
            ...(dto.rack_location !== undefined && { rack_location: dto.rack_location }),
        });
        return this.bookRepo.save(book);
    }
    async issueBook(schoolId, dto) {
        const book = await this.bookRepo.findOne({ where: { id: dto.book_id, school_id: schoolId } });
        if (!book)
            throw new common_1.NotFoundException('Book not found');
        if (book.available_copies <= 0)
            throw new common_1.BadRequestException('No copies available for this book');
        const issue = await this.issueRepo.save(this.issueRepo.create({
            school_id: schoolId,
            book_id: dto.book_id,
            issued_to_user_id: dto.issued_to_user_id,
            issue_date: new Date().toISOString().slice(0, 10),
            due_date: dto.due_date,
            status: 'issued',
        }));
        book.available_copies -= 1;
        await this.bookRepo.save(book);
        return issue;
    }
    async returnBook(schoolId, issueId) {
        const issue = await this.issueRepo.findOne({ where: { id: issueId, school_id: schoolId } });
        if (!issue)
            throw new common_1.NotFoundException('Issue record not found');
        if (issue.status === 'returned')
            throw new common_1.BadRequestException('This book has already been returned');
        const today = new Date();
        const dueDate = new Date(issue.due_date);
        let fine = 0;
        if (today > dueDate) {
            const daysLate = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
            const finePerDay = school?.settings?.library_fine_per_day ?? DEFAULT_FINE_PER_DAY;
            fine = daysLate * finePerDay;
        }
        issue.return_date = today.toISOString().slice(0, 10);
        issue.status = 'returned';
        issue.fine_amount = fine;
        await this.issueRepo.save(issue);
        const book = await this.bookRepo.findOne({ where: { id: issue.book_id } });
        if (book) {
            book.available_copies += 1;
            await this.bookRepo.save(book);
        }
        return issue;
    }
    async getDashboard(schoolId) {
        const [totalBooks, issuedCount, overdueRows, fineRows] = await Promise.all([
            this.bookRepo.sum('total_copies', { school_id: schoolId }),
            this.issueRepo.count({ where: { school_id: schoolId, status: 'issued' } }),
            this.issueRepo
                .createQueryBuilder('i')
                .where('i.school_id = :schoolId AND i.status = :status AND i.due_date < :today', {
                schoolId,
                status: 'issued',
                today: new Date().toISOString().slice(0, 10),
            })
                .getCount(),
            this.issueRepo
                .createQueryBuilder('i')
                .select('SUM(i.fine_amount)', 'total')
                .where('i.school_id = :schoolId AND i.fine_paid = 1', { schoolId })
                .getRawOne(),
        ]);
        return {
            total_books: totalBooks || 0,
            books_issued: issuedCount,
            overdue_books: overdueRows,
            fine_collected: Number(fineRows?.total) || 0,
        };
    }
};
exports.LibraryService = LibraryService;
exports.LibraryService = LibraryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(library_book_entity_1.LibraryBookEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(library_book_issue_entity_1.LibraryBookIssueEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(school_entity_1.SchoolEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], LibraryService);
//# sourceMappingURL=library.service.js.map