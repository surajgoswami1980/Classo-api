import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles, UserRole } from '../../common/decorators/roles.decorator';
import { RequirePermissions, Permission } from '../../common/decorators/permissions.decorator';
import { SchoolId } from '../../common/decorators/school-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { InventoryService } from './inventory.service';
import {
  CreateCategoryDto,
  CreateItemDto,
  UpdateItemDto,
  StockTransactionDto,
  ListItemsQueryDto,
} from './dto/inventory.dto';

@ApiTags('Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('dashboard')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  @ApiOperation({ summary: 'Inventory dashboard totals' })
  async dashboard(@SchoolId() schoolId: number) {
    const result = await this.inventoryService.getDashboard(schoolId);
    return { success: true, data: result };
  }

  // ─── Categories ──────────────────────────────────────────────

  @Get('category/list')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  @ApiOperation({ summary: 'List inventory categories' })
  async listCategories(@SchoolId() schoolId: number) {
    const result = await this.inventoryService.listCategories(schoolId);
    return { success: true, data: result };
  }

  @Post('category/create')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.STAFF)
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiOperation({ summary: 'Create an inventory category' })
  async createCategory(@SchoolId() schoolId: number, @Body() dto: CreateCategoryDto) {
    const result = await this.inventoryService.createCategory(schoolId, dto);
    return { success: true, data: result };
  }

  // ─── Items ───────────────────────────────────────────────────

  @Get('item/list')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  @ApiOperation({ summary: 'List items (search / low-stock filters)' })
  async listItems(@SchoolId() schoolId: number, @Query() query: ListItemsQueryDto) {
    const result = await this.inventoryService.listItems(schoolId, query);
    return { success: true, ...result };
  }

  @Post('item/create')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.STAFF)
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiOperation({ summary: 'Add an inventory item' })
  async createItem(@SchoolId() schoolId: number, @Body() dto: CreateItemDto) {
    const result = await this.inventoryService.createItem(schoolId, dto);
    return { success: true, data: result };
  }

  @Put('item/:id')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.STAFF)
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiOperation({ summary: 'Update an inventory item' })
  async updateItem(@SchoolId() schoolId: number, @Param('id') id: number, @Body() dto: UpdateItemDto) {
    const result = await this.inventoryService.updateItem(schoolId, id, dto);
    return { success: true, data: result };
  }

  // ─── Stock transactions ──────────────────────────────────────

  @Post('stock/transaction')
  @Roles(UserRole.SCHOOL_ADMIN, UserRole.SUB_ADMIN, UserRole.STAFF)
  @RequirePermissions(Permission.INVENTORY_MANAGE)
  @ApiOperation({ summary: 'Record a stock in/out movement' })
  async recordTransaction(@SchoolId() schoolId: number, @CurrentUser('user_id') userId: number, @Body() dto: StockTransactionDto) {
    const result = await this.inventoryService.recordTransaction(schoolId, dto, userId);
    return { success: true, data: result };
  }

  @Get('stock/transactions')
  @RequirePermissions(Permission.INVENTORY_VIEW)
  @ApiOperation({ summary: 'List recent stock movements' })
  async listTransactions(@SchoolId() schoolId: number, @Query('item_id') itemId?: number) {
    const result = await this.inventoryService.listTransactions(schoolId, itemId ? Number(itemId) : undefined);
    return { success: true, data: result };
  }
}
