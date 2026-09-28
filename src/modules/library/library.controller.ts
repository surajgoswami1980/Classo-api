import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { RequirePermissions, Permission } from '../../common/decorators/permissions.decorator';
import { SchoolId } from '../../common/decorators/school-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { LibraryService } from './library.service';
import { CreateBookDto, UpdateBookDto, ListBooksQueryDto, IssueBookDto, ReturnBookDto, ListIssuesQueryDto } from './dto/library.dto';

@ApiTags('Library')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get('book/list')
  @RequirePermissions(Permission.LIBRARY_VIEW)
  @ApiOperation({ summary: 'List/search the book catalog' })
  async listBooks(@Query() query: ListBooksQueryDto, @SchoolId() schoolId: number) {
    const result = await this.libraryService.listBooks(schoolId, query);
    return { success: true, ...result };
  }

  @Post('book/create')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.STAFF)
  @RequirePermissions(Permission.LIBRARY_MANAGE)
  @ApiOperation({ summary: 'Add a book to the catalog' })
  async createBook(@Body() dto: CreateBookDto, @SchoolId() schoolId: number) {
    const result = await this.libraryService.createBook(schoolId, dto);
    return { success: true, data: result };
  }

  @Put('book/:id')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.STAFF)
  @RequirePermissions(Permission.LIBRARY_MANAGE)
  @ApiOperation({ summary: 'Update a book' })
  async updateBook(@Param('id') id: number, @Body() dto: UpdateBookDto, @SchoolId() schoolId: number) {
    const result = await this.libraryService.updateBook(schoolId, id, dto);
    return { success: true, data: result };
  }

  @Post('book/issue')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.STAFF)
  @RequirePermissions(Permission.LIBRARY_ISSUE)
  @ApiOperation({ summary: 'Issue a book to a student or staff member' })
  async issueBook(@Body() dto: IssueBookDto, @SchoolId() schoolId: number) {
    const result = await this.libraryService.issueBook(schoolId, dto);
    return { success: true, data: result };
  }

  @Post('book/return')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.STAFF)
  @RequirePermissions(Permission.LIBRARY_ISSUE)
  @ApiOperation({ summary: 'Return a book and settle any overdue fine' })
  async returnBook(@Body() dto: ReturnBookDto, @SchoolId() schoolId: number) {
    const result = await this.libraryService.returnBook(schoolId, dto.issue_id);
    return { success: true, data: result };
  }

  @Get('issue/list')
  @RequirePermissions(Permission.LIBRARY_VIEW)
  @ApiOperation({ summary: 'List issued/returned books with fine and days-to-expire (filterable)' })
  async listIssues(@Query() query: ListIssuesQueryDto, @SchoolId() schoolId: number) {
    const result = await this.libraryService.listIssues(schoolId, query);
    return { success: true, ...result };
  }

  @Get('student/:studentId/books')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.TEACHER, UserRole.STAFF, UserRole.INCHARGE)
  @RequirePermissions(Permission.LIBRARY_VIEW)
  @ApiOperation({ summary: "List a specific student's issued books (admin per-student view)" })
  async listStudentBooks(@Param('studentId') studentId: number, @SchoolId() schoolId: number) {
    const result = await this.libraryService.listIssues(schoolId, { student_id: studentId, limit: 200 });
    return { success: true, ...result };
  }

  @Get('my-books')
  @Roles(UserRole.STUDENT, UserRole.PARENT, UserRole.TEACHER, UserRole.STAFF, UserRole.INCHARGE)
  @ApiOperation({ summary: "The logged-in user's own issued books + outstanding fines" })
  async getMyBooks(@SchoolId() schoolId: number, @CurrentUser('user_id') userId: number) {
    const result = await this.libraryService.getMyBooks(schoolId, userId);
    return { success: true, data: result };
  }

  @Get('dashboard')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.STAFF)
  @RequirePermissions(Permission.LIBRARY_VIEW)
  @ApiOperation({ summary: 'Library dashboard — totals, issued, overdue, fine collected' })
  async getDashboard(@SchoolId() schoolId: number) {
    const result = await this.libraryService.getDashboard(schoolId);
    return { success: true, data: result };
  }
}
