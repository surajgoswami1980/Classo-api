import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SchoolService } from './school.service';
import { SchoolId } from '../../common/decorators/school-id.decorator';

@ApiTags('School')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('school')
export class SchoolController {
  constructor(private readonly schoolService: SchoolService) {}

  @Get('classes')
  async getClasses(@SchoolId() schoolId: number) {
    const result = await this.schoolService.getClasses(schoolId);
    return { success: true, data: result };
  }

  @Get('sections')
  async getSections(
    @SchoolId() schoolId: number,
    @Query('class_id') classId: number,
  ) {
    const result = await this.schoolService.getSections(schoolId, classId);
    return { success: true, data: result };
  }
}
