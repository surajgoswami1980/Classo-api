import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LibraryController } from './library.controller';
import { LibraryService } from './library.service';
import { LibraryBookEntity } from '../../entities/library-book.entity';
import { LibraryBookIssueEntity } from '../../entities/library-book-issue.entity';
import { SchoolEntity } from '../../entities/school.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LibraryBookEntity, LibraryBookIssueEntity, SchoolEntity])],
  controllers: [LibraryController],
  providers: [LibraryService],
  exports: [LibraryService],
})
export class LibraryModule {}
