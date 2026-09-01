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
  issued_to_user_id: number;
  due_date: string;
}

export class ReturnBookDto {
  issue_id: number;
}
