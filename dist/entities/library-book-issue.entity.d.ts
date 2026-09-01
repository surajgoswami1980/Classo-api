export declare class LibraryBookIssueEntity {
    id: number;
    school_id: number;
    book_id: number;
    issued_to_user_id: number;
    issue_date: Date;
    due_date: Date;
    return_date: Date;
    fine_amount: number;
    fine_paid: number;
    status: string;
    created_at: Date;
    updated_at: Date;
}
