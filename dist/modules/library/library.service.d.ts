import { Repository } from 'typeorm';
import { LibraryBookEntity } from '../../entities/library-book.entity';
import { LibraryBookIssueEntity } from '../../entities/library-book-issue.entity';
import { SchoolEntity } from '../../entities/school.entity';
import { CreateBookDto, UpdateBookDto, ListBooksQueryDto, IssueBookDto } from './dto/library.dto';
export declare class LibraryService {
    private bookRepo;
    private issueRepo;
    private schoolRepo;
    constructor(bookRepo: Repository<LibraryBookEntity>, issueRepo: Repository<LibraryBookIssueEntity>, schoolRepo: Repository<SchoolEntity>);
    listBooks(schoolId: number, query: ListBooksQueryDto): Promise<{
        data: LibraryBookEntity[];
        total: number;
        page: number;
        limit: number;
        total_pages: number;
    }>;
    createBook(schoolId: number, dto: CreateBookDto): Promise<LibraryBookEntity>;
    updateBook(schoolId: number, id: number, dto: UpdateBookDto): Promise<LibraryBookEntity>;
    issueBook(schoolId: number, dto: IssueBookDto): Promise<LibraryBookIssueEntity>;
    returnBook(schoolId: number, issueId: number): Promise<LibraryBookIssueEntity>;
    getDashboard(schoolId: number): Promise<{
        total_books: number;
        books_issued: number;
        overdue_books: number;
        fine_collected: number;
    }>;
}
