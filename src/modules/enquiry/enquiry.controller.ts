import { Controller, Post, Get, Body, Req, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EnquiryService } from './enquiry.service';
import { CreateEnquiryDto } from './dto/enquiry.dto';

/**
 * PUBLIC endpoint — no auth, no tenant. The marketing website posts the
 * "Request a demo / Contact us" form here. Rows land in the `enquiries`
 * table and are worked by the super-admin in the Laravel admin panel.
 */
@ApiTags('Enquiry')
@Controller('enquiry')
export class EnquiryController {
  constructor(private readonly enquiryService: EnquiryService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Submit a public website enquiry / demo request' })
  async create(@Body() dto: CreateEnquiryDto, @Req() req: any) {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket?.remoteAddress ||
      null;
    const data = await this.enquiryService.create(dto, ip);
    return {
      success: true,
      message: 'Thanks for reaching out! Our team will contact you shortly.',
      data,
    };
  }

  @Get('ping')
  @ApiOperation({ summary: 'Health/reachability check for the enquiry endpoint' })
  ping() {
    return { success: true, module: 'enquiry' };
  }
}
