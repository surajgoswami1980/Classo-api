export declare class CreateBookDto {
    title: string;
    author?: string;
    isbn?: string;
    category?: string;
    publisher?: string;
    total_copies?: number;
    rack_location?: string;
}
export declare class UpdateBookDto {
    title?: string;
    author?: string;
    isbn?: string;
    category?: string;
    publisher?: string;
    total_copies?: number;
    rack_location?: string;
}
export declare class ListBooksQueryDto {
    search?: string;
    category?: string;
    page?: number;
    limit?: number;
}
export declare class IssueBookDto {
    book_id: number;
    issued_to_user_id: number;
    due_date: string;
}
export declare class ReturnBookDto {
    issue_id: number;
}
