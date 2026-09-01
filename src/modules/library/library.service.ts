import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LibraryBookEntity } from '../../entities/library-book.entity';
import { LibraryBookIssueEntity } from '../../entities/library-book-issue.entity';
import { SchoolEntity } from '../../entities/school.entity';
import { CreateBookDto, UpdateBookDto, ListBooksQueryDto, IssueBookDto } from './dto/library.dto';

const DEFAULT_FINE_PER_DAY = 2;

@Injectable()
export class LibraryService {
  constructor(
    @InjectRepository(LibraryBookEntity) private bookRepo: Repository<LibraryBookEntity>,
    @InjectRepository(LibraryBookIssueEntity) private issueRepo: Repository<LibraryBookIssueEntity>,
    @InjectRepository(SchoolEntity) private schoolRepo: Repository<SchoolEntity>,
  ) {}

  async listBooks(schoolId: number, query: ListBooksQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;

    const qb = this.bookRepo.createQueryBuilder('b').where('b.school_id = :schoolId', { schoolId });

    if (query.category) qb.andWhere('b.category = :category', { category: query.category });
    if (query.search) {
      qb.andWhere('(b.title LIKE :search OR b.author LIKE :search OR b.isbn LIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    const total = await qb.getCount();
    const data = await qb.orderBy('b.title', 'ASC').skip((page - 1) * limit).take(limit).getMany();

    return { data, total, page, limit, total_pages: Math.ceil(total / limit) };
  }

  async createBook(schoolId: number, dto: CreateBookDto) {
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

  async updateBook(schoolId: number, id: number, dto: UpdateBookDto) {
    const book = await this.bookRepo.findOne({ where: { id, school_id: schoolId } });
    if (!book) throw new NotFoundException('Book not found');

    if (dto.total_copies !== undefined) {
      const issuedCount = book.total_copies - book.available_copies;
      if (dto.total_copies < issuedCount) {
        throw new BadRequestException(`Cannot reduce total copies below ${issuedCount} (currently issued)`);
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

  /**
   * Issue a book to a student or staff member.
   */
  async issueBook(schoolId: number, dto: IssueBookDto) {
    const book = await this.bookRepo.findOne({ where: { id: dto.book_id, school_id: schoolId } });
    if (!book) throw new NotFoundException('Book not found');
    if (book.available_copies <= 0) throw new BadRequestException('No copies available for this book');

    const issue = await this.issueRepo.save(
      this.issueRepo.create({
        school_id: schoolId,
        book_id: dto.book_id,
        issued_to_user_id: dto.issued_to_user_id,
        issue_date: new Date().toISOString().slice(0, 10) as any,
        due_date: dto.due_date as any,
        status: 'issued',
      }),
    );

    book.available_copies -= 1;
    await this.bookRepo.save(book);

    return issue;
  }

  /**
   * Return a book — computes an overdue fine (per-day rate configurable
   * via the school's `settings.library_fine_per_day`, default ₹2/day).
   */
  async returnBook(schoolId: number, issueId: number) {
    const issue = await this.issueRepo.findOne({ where: { id: issueId, school_id: schoolId } });
    if (!issue) throw new NotFoundException('Issue record not found');
    if (issue.status === 'returned') throw new BadRequestException('This book has already been returned');

    const today = new Date();
    const dueDate = new Date(issue.due_date);
    let fine = 0;

    if (today > dueDate) {
      const daysLate = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
      const finePerDay = school?.settings?.library_fine_per_day ?? DEFAULT_FINE_PER_DAY;
      fine = daysLate * finePerDay;
    }

    issue.return_date = today.toISOString().slice(0, 10) as any;
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

  async getDashboard(schoolId: number) {
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
}
