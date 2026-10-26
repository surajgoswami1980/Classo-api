import {
  Controller,
  Post,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SchoolId } from '../../common/decorators/school-id.decorator';
import { UploadService } from './upload.service';

/**
 * Generic file upload. Any authenticated user can upload a file (e.g. a
 * teacher attaching a worksheet, a student submitting an assignment). The
 * file goes to S3 under the caller's school folder and the public URL is
 * returned to store in the relevant record (attachment_url, etc.).
 */
@ApiTags('Upload')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Get('status')
  @ApiOperation({ summary: 'Whether file uploads (S3) are configured' })
  async status() {
    return { success: true, data: { enabled: await this.uploadService.isEnabled() } };
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a file to S3 and get back its public URL' })
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder: string,
    @SchoolId() schoolId: number,
  ) {
    if (!file) throw new BadRequestException('File is required (field name: "file").');
    const result = await this.uploadService.upload(file, folder || 'documents', schoolId);
    return { success: true, data: result };
  }
}
