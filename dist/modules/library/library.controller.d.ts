import { LibraryService } from './library.service';
import { CreateBookDto, UpdateBookDto, ListBooksQueryDto, IssueBookDto, ReturnBookDto, ListIssuesQueryDto } from './dto/library.dto';
export declare class LibraryController {
    private readonly libraryService;
    constructor(libraryService: LibraryService);
    listBooks(query: ListBooksQueryDto, schoolId: number): Promise<{
        data: import("../../entities/library-book.entity").LibraryBookEntity[];
        total: number;
        page: number;
        limit: number;
        total_pages: number;
        success: boolean;
    }>;
    createBook(dto: CreateBookDto, schoolId: number): Promise<{
        success: boolean;
        data: import("../../entities/library-book.entity").LibraryBookEntity;
    }>;
    updateBook(id: number, dto: UpdateBookDto, schoolId: number): Promise<{
        success: boolean;
        data: import("../../entities/library-book.entity").LibraryBookEntity;
    }>;
    issueBook(dto: IssueBookDto, schoolId: number): Promise<{
        success: boolean;
        data: import("../../entities/library-book-issue.entity").LibraryBookIssueEntity;
    }>;
    returnBook(dto: ReturnBookDto, schoolId: number): Promise<{
        success: boolean;
        data: import("../../entities/library-book-issue.entity").LibraryBookIssueEntity;
    }>;
    listIssues(query: ListIssuesQueryDto, schoolId: number): Promise<{
        data: any;
        total: number;
        page: number;
        limit: number;
        total_pages: number;
        success: boolean;
    }>;
    listStudentBooks(studentId: number, schoolId: number): Promise<{
        data: any;
        total: number;
        page: number;
        limit: number;
        total_pages: number;
        success: boolean;
    }>;
    getMyBooks(schoolId: number, userId: number): Promise<{
        success: boolean;
        data: {
            books: any;
            summary: {
                total_issued: any;
                overdue: any;
                outstanding_fine: number;
            };
        };
    }>;
    getDashboard(schoolId: number): Promise<{
        success: boolean;
        data: {
            total_books: number;
            books_issued: number;
            overdue_books: number;
            fine_collected: number;
        };
    }>;
}
