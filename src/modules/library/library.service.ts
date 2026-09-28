import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LibraryBookEntity } from '../../entities/library-book.entity';
import { LibraryBookIssueEntity } from '../../entities/library-book-issue.entity';
import { SchoolEntity } from '../../entities/school.entity';
import { StudentEntity } from '../../entities/student.entity';
import { CreateBookDto, UpdateBookDto, ListBooksQueryDto, IssueBookDto, ListIssuesQueryDto } from './dto/library.dto';

const DEFAULT_FINE_PER_DAY = 2;

@Injectable()
export class LibraryService {
  constructor(
    @InjectRepository(LibraryBookEntity) private bookRepo: Repository<LibraryBookEntity>,
    @InjectRepository(LibraryBookIssueEntity) private issueRepo: Repository<LibraryBookIssueEntity>,
    @InjectRepository(SchoolEntity) private schoolRepo: Repository<SchoolEntity>,
    @InjectRepository(StudentEntity) private studentRepo: Repository<StudentEntity>,
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
   * Issue a book to a student or staff member. Accepts either a raw
   * issued_to_user_id (staff) or a student_id — for a student we resolve and
   * store both the student_id and its linked user_id so the student can see
   * the issue from their own login and admins can list per-student.
   */
  async issueBook(schoolId: number, dto: IssueBookDto) {
    const book = await this.bookRepo.findOne({ where: { id: dto.book_id, school_id: schoolId } });
    if (!book) throw new NotFoundException('Book not found');
    if (book.available_copies <= 0) throw new BadRequestException('No copies available for this book');

    let userId = dto.issued_to_user_id;
    let studentId = dto.student_id;

    if (studentId) {
      const student = await this.studentRepo.findOne({ where: { id: studentId, school_id: schoolId } });
      if (!student) throw new BadRequestException('Invalid student for this school');
      userId = student.user_id;
    }

    if (!userId) throw new BadRequestException('Provide either student_id or issued_to_user_id');

    const issue = await this.issueRepo.save(
      this.issueRepo.create({
        school_id: schoolId,
        book_id: dto.book_id,
        issued_to_user_id: userId,
        student_id: studentId ?? null,
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
   * Convenience wrapper — assign (issue) a book directly to a student.
   */
  async assignToStudent(schoolId: number, bookId: number, studentId: number, dueDate: string) {
    return this.issueBook(schoolId, { book_id: bookId, student_id: studentId, due_date: dueDate });
  }

  /**
   * List issued/returned book records with book + borrower info, computed
   * overdue fine (for still-issued records) and days-to-expire. Powers the
   * admin "issued books" screen and the per-student book history.
   */
  async listIssues(schoolId: number, query: ListIssuesQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;

    const finePerDay = await this.getFinePerDay(schoolId);

    const conditions: string[] = ['i.school_id = ?'];
    const params: any[] = [schoolId];

    if (query.status) { conditions.push('i.status = ?'); params.push(query.status); }
    if (query.student_id) { conditions.push('i.student_id = ?'); params.push(query.student_id); }
    if (query.book_id) { conditions.push('i.book_id = ?'); params.push(query.book_id); }
    if (query.overdue_only === 'true') { conditions.push("i.status = 'issued' AND i.due_date < CURDATE()"); }
    if (query.expiring_within_days) {
      conditions.push("i.status = 'issued' AND i.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY)");
      params.push(Number(query.expiring_within_days));
    }

    const where = conditions.join(' AND ');

    const countRows = await this.issueRepo.query(
      `SELECT COUNT(*) as total FROM library_book_issues i WHERE ${where}`,
      params,
    );
    const total = Number(countRows[0]?.total) || 0;

    const rows = await this.issueRepo.query(
      `SELECT i.id, i.book_id, i.issued_to_user_id, i.student_id,
              i.issue_date, i.due_date, i.return_date, i.fine_amount, i.fine_paid, i.status,
              b.title AS book_title, b.author AS book_author, b.isbn AS book_isbn,
              u.name AS borrower_name,
              s.roll_number, s.admission_number,
              DATEDIFF(i.due_date, CURDATE()) AS days_to_expire
       FROM library_book_issues i
       JOIN library_books b ON b.id = i.book_id
       LEFT JOIN users u ON u.id = i.issued_to_user_id
       LEFT JOIN students s ON s.id = i.student_id
       WHERE ${where}
       ORDER BY i.status = 'issued' DESC, i.due_date ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit],
    );

    const today = new Date();
    const data = rows.map((r: any) => {
      const daysToExpire = r.days_to_expire !== null ? Number(r.days_to_expire) : null;
      // For still-issued records, project the current running overdue fine.
      let currentFine = Number(r.fine_amount) || 0;
      if (r.status === 'issued' && daysToExpire !== null && daysToExpire < 0) {
        currentFine = Math.abs(daysToExpire) * finePerDay;
      }
      return {
        ...r,
        fine_amount: Number(r.fine_amount) || 0,
        current_fine: currentFine,
        days_to_expire: daysToExpire,
        is_overdue: r.status === 'issued' && daysToExpire !== null && daysToExpire < 0,
      };
    });

    return { data, total, page, limit, total_pages: Math.ceil(total / limit) };
  }

  /**
   * The books currently/previously issued to the logged-in user (student or
   * staff), with running fine + days-to-expire — powers the web "My Books".
   */
  async getMyBooks(schoolId: number, userId: number) {
    const finePerDay = await this.getFinePerDay(schoolId);

    const rows = await this.issueRepo.query(
      `SELECT i.id, i.book_id, i.issue_date, i.due_date, i.return_date,
              i.fine_amount, i.fine_paid, i.status,
              b.title AS book_title, b.author AS book_author, b.isbn AS book_isbn,
              DATEDIFF(i.due_date, CURDATE()) AS days_to_expire
       FROM library_book_issues i
       JOIN library_books b ON b.id = i.book_id
       WHERE i.school_id = ? AND i.issued_to_user_id = ?
       ORDER BY i.status = 'issued' DESC, i.due_date ASC`,
      [schoolId, userId],
    );

    let totalOutstandingFine = 0;
    const books = rows.map((r: any) => {
      const daysToExpire = r.days_to_expire !== null ? Number(r.days_to_expire) : null;
      let currentFine = Number(r.fine_amount) || 0;
      if (r.status === 'issued' && daysToExpire !== null && daysToExpire < 0) {
        currentFine = Math.abs(daysToExpire) * finePerDay;
      }
      if (r.status === 'issued' && !r.fine_paid) totalOutstandingFine += currentFine;
      else if (r.status === 'returned' && !r.fine_paid) totalOutstandingFine += Number(r.fine_amount) || 0;
      return {
        ...r,
        fine_amount: Number(r.fine_amount) || 0,
        current_fine: currentFine,
        days_to_expire: daysToExpire,
        is_overdue: r.status === 'issued' && daysToExpire !== null && daysToExpire < 0,
      };
    });

    return {
      books,
      summary: {
        total_issued: books.filter((b: any) => b.status === 'issued').length,
        overdue: books.filter((b: any) => b.is_overdue).length,
        outstanding_fine: totalOutstandingFine,
      },
    };
  }

  private async getFinePerDay(schoolId: number): Promise<number> {
    const school = await this.schoolRepo.findOne({ where: { id: schoolId } });
    return school?.settings?.library_fine_per_day ?? DEFAULT_FINE_PER_DAY;
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
