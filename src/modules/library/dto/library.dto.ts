export class CreateBookDto {
  title: string;
  author?: string;
  isbn?: string;
  category?: string;
  publisher?: string;
  total_copies?: number;
  rack_location?: string;
}

export class UpdateBookDto {
  title?: string;
  author?: string;
  isbn?: string;
  category?: string;
  publisher?: string;
  total_copies?: number;
  rack_location?: string;
}

export class ListBooksQueryDto {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export class IssueBookDto {
  book_id: number;
  // Either issue to a raw user (staff) or to a student. If student_id is
  // provided, the service resolves the linked user_id automatically.
  issued_to_user_id?: number;
  student_id?: number;
  due_date: string;
}

export class ReturnBookDto {
  issue_id: number;
}

export class ListIssuesQueryDto {
  status?: 'issued' | 'returned' | 'overdue';
  student_id?: number;
  book_id?: number;
  overdue_only?: string;
  expiring_within_days?: number;
  page?: number;
  limit?: number;
}
