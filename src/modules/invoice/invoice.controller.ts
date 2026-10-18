import { Controller, Get, Param, Query, Req, Res, UseGuards, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SchoolId } from '../../common/decorators/school-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { InvoiceAggregatorService } from './invoice-aggregator.service';

/**
 * Unified invoices for the logged-in user: fees + events + store in one list.
 * Powers the "Invoices" tab in the web and mobile apps.
 */
@ApiTags('Invoices')
@Controller('invoices')
export class InvoiceController {
  constructor(
    private readonly aggregator: InvoiceAggregatorService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  @Get('my')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'All my invoices (fees + events + store) in one place' })
  async myInvoices(
    @SchoolId() schoolId: number,
    @CurrentUser('user_id') userId: number,
    @Query('type') type?: string,
  ) {
    const data = await this.aggregator.myInvoices(schoolId, userId, type);
    return { success: true, data };
  }

  /**
   * Printable HTML document. Accepts the JWT via the Authorization header
   * (web blob fetch) OR a `?t=` query token (mobile browser / new-tab open),
   * so it works from both without a login wall.
   */
  @Get(':source/:id/document')
  @ApiOperation({ summary: 'Render a printable invoice document (HTML) for one item' })
  async document(
    @Param('source') source: string,
    @Param('id') id: number,
    @Query('t') tokenQuery: string,
    @Req() req: any,
    @Res() res: any,
  ) {
    const header = req.headers['authorization'];
    const token = (header && header.startsWith('Bearer ') ? header.slice(7) : null) || tokenQuery;
    if (!token) throw new UnauthorizedException('Missing token');

    let payload: any;
    try {
      payload = this.jwt.verify(token, { secret: this.config.get('JWT_SECRET') || 'fallback-secret' });
    } catch {
      throw new UnauthorizedException('Invalid token');
    }

    const html = await this.aggregator.renderDocument(payload.school_id, payload.user_id, source, id);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }
}
