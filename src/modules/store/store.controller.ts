import { Controller, Get, Post, Body, Param, Query, Res, NotFoundException, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { SchoolId } from '../../common/decorators/school-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { StoreService } from './store.service';
import { StoreInvoiceService } from './store-invoice.service';

@ApiTags('Store')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('store')
export class StoreController {
  constructor(
    private readonly storeService: StoreService,
    private readonly invoiceService: StoreInvoiceService,
  ) {}

  @Get('items')
  @ApiOperation({ summary: 'List active store items for the school' })
  async items(@SchoolId() schoolId: number) {
    const data = await this.storeService.listItems(schoolId);
    return { success: true, data };
  }

  @Get('my-orders')
  @ApiOperation({ summary: "The current user's store orders" })
  async myOrders(@SchoolId() schoolId: number, @CurrentUser('user_id') userId: number) {
    const data = await this.storeService.myOrders(schoolId, userId);
    return { success: true, data };
  }

  @Post('purchase')
  @ApiOperation({ summary: 'Start a purchase — creates a Razorpay order' })
  async purchase(
    @SchoolId() schoolId: number,
    @CurrentUser('user_id') userId: number,
    @Body() body: { item_id: number; quantity?: number; name?: string; email?: string; phone?: string },
  ) {
    const data = await this.storeService.purchase(schoolId, userId, body.item_id, body.quantity || 1, {
      name: body.name || '',
      email: body.email || '',
      contact: body.phone || '',
    });
    return { success: true, data };
  }

  @Post('purchase/verify')
  @ApiOperation({ summary: 'Verify Razorpay payment and mark order purchased' })
  async verify(
    @SchoolId() schoolId: number,
    @Body() body: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string },
  ) {
    const data = await this.storeService.verifyPurchase(schoolId, body);
    return { success: true, data };
  }

  @Get('orders/:id/invoice')
  @ApiOperation({ summary: 'Download the invoice (HTML/printable) for a paid order' })
  async invoice(
    @SchoolId() schoolId: number,
    @CurrentUser('user_id') userId: number,
    @Param('id') id: number,
    @Res() res: Response,
  ) {
    const data = await this.storeService.getInvoiceData(schoolId, Number(id), userId);
    if (!data) throw new NotFoundException('Invoice not available for this order');

    const html = this.invoiceService.generateInvoiceHtml(data);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }

  // ─── Admin (school admin / sub admin) ───────────────────────

  @Get('admin/orders')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @ApiOperation({ summary: 'Admin: list store orders for the school' })
  async adminOrders(@SchoolId() schoolId: number, @Query('status') status?: string) {
    const data = await this.storeService.adminListOrders(schoolId, status);
    return { success: true, data };
  }

  @Post('admin/orders/:id/collect')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN)
  @ApiOperation({ summary: 'Admin: mark a paid order as collected/completed' })
  async adminCollect(@SchoolId() schoolId: number, @Param('id') id: number) {
    const data = await this.storeService.adminMarkCollected(schoolId, Number(id));
    return { success: true, data };
  }
}
