import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SchoolId } from '../../common/decorators/school-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { BannerService, BannerPlacement } from './banner.service';

@ApiTags('Banner')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('banner')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Get('list')
  @ApiOperation({ summary: 'Live banners for the current user (optionally filter by placement)' })
  async list(
    @CurrentUser('user_id') userId: number,
    @CurrentUser('role') role: string,
    @SchoolId() schoolId: number,
    @Query('placement') placement?: BannerPlacement,
  ) {
    const data = await this.bannerService.getBanners(schoolId, userId, role, placement);
    return { success: true, data };
  }

  @Get('popup')
  @ApiOperation({ summary: 'The single active popup banner for the current user (or null)' })
  async popup(
    @CurrentUser('user_id') userId: number,
    @CurrentUser('role') role: string,
    @SchoolId() schoolId: number,
  ) {
    const data = await this.bannerService.getPopup(schoolId, userId, role);
    return { success: true, data };
  }
}
