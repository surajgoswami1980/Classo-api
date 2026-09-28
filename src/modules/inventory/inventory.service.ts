import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryCategoryEntity } from '../../entities/inventory-category.entity';
import { InventoryItemEntity } from '../../entities/inventory-item.entity';
import { InventoryTransactionEntity } from '../../entities/inventory-transaction.entity';
import {
  CreateCategoryDto,
  CreateItemDto,
  UpdateItemDto,
  StockTransactionDto,
  ListItemsQueryDto,
} from './dto/inventory.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(InventoryCategoryEntity) private categoryRepo: Repository<InventoryCategoryEntity>,
    @InjectRepository(InventoryItemEntity) private itemRepo: Repository<InventoryItemEntity>,
    @InjectRepository(InventoryTransactionEntity) private txnRepo: Repository<InventoryTransactionEntity>,
  ) {}

  // ─── Categories ──────────────────────────────────────────────

  async listCategories(schoolId: number) {
    return this.categoryRepo.find({ where: { school_id: schoolId }, order: { name: 'ASC' } });
  }

  async createCategory(schoolId: number, dto: CreateCategoryDto) {
    return this.categoryRepo.save(this.categoryRepo.create({ school_id: schoolId, name: dto.name }));
  }

  // ─── Items ───────────────────────────────────────────────────

  async listItems(schoolId: number, query: ListItemsQueryDto) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;

    const qb = this.itemRepo
      .createQueryBuilder('i')
      .leftJoin(InventoryCategoryEntity, 'c', 'c.id = i.category_id')
      .select(['i.*', 'c.name AS category_name'])
      .where('i.school_id = :schoolId', { schoolId });

    if (query.category_id) qb.andWhere('i.category_id = :cid', { cid: query.category_id });
    if (query.search) qb.andWhere('(i.name LIKE :s OR i.sku LIKE :s)', { s: `%${query.search}%` });
    if (query.low_stock === 'true') qb.andWhere('i.quantity <= i.reorder_level');

    const total = await qb.getCount();
    const data = await qb.orderBy('i.name', 'ASC').offset((page - 1) * limit).limit(limit).getRawMany();

    return { data, total, page, limit, total_pages: Math.ceil(total / limit) };
  }

  async createItem(schoolId: number, dto: CreateItemDto) {
    return this.itemRepo.save(
      this.itemRepo.create({
        school_id: schoolId,
        category_id: dto.category_id ?? null,
        name: dto.name,
        sku: dto.sku,
        unit: dto.unit || 'pcs',
        quantity: dto.quantity ?? 0,
        reorder_level: dto.reorder_level ?? 0,
        unit_price: dto.unit_price ?? 0,
        location: dto.location,
        is_active: 1,
      }),
    );
  }

  async updateItem(schoolId: number, id: number, dto: UpdateItemDto) {
    const item = await this.itemRepo.findOne({ where: { id, school_id: schoolId } });
    if (!item) throw new NotFoundException('Item not found');

    Object.assign(item, {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.category_id !== undefined && { category_id: dto.category_id }),
      ...(dto.sku !== undefined && { sku: dto.sku }),
      ...(dto.unit !== undefined && { unit: dto.unit }),
      ...(dto.reorder_level !== undefined && { reorder_level: dto.reorder_level }),
      ...(dto.unit_price !== undefined && { unit_price: dto.unit_price }),
      ...(dto.location !== undefined && { location: dto.location }),
    });
    return this.itemRepo.save(item);
  }

  // ─── Stock transactions ──────────────────────────────────────

  /**
   * Record a stock movement (in = purchase/receive, out = issue) and adjust
   * the item quantity atomically.
   */
  async recordTransaction(schoolId: number, dto: StockTransactionDto, userId: number) {
    const item = await this.itemRepo.findOne({ where: { id: dto.item_id, school_id: schoolId } });
    if (!item) throw new NotFoundException('Item not found');
    if (dto.quantity <= 0) throw new BadRequestException('Quantity must be greater than 0');

    if (dto.type === 'out' && item.quantity < dto.quantity) {
      throw new BadRequestException(`Insufficient stock. Available: ${item.quantity}`);
    }

    const txn = await this.txnRepo.save(
      this.txnRepo.create({
        school_id: schoolId,
        item_id: dto.item_id,
        type: dto.type,
        quantity: dto.quantity,
        unit_price: dto.unit_price ?? item.unit_price,
        reference: dto.reference,
        remarks: dto.remarks,
        created_by: userId,
      }),
    );

    item.quantity += dto.type === 'in' ? dto.quantity : -dto.quantity;
    if (dto.type === 'in' && dto.unit_price) item.unit_price = dto.unit_price;
    await this.itemRepo.save(item);

    return { transaction: txn, new_quantity: item.quantity };
  }

  async listTransactions(schoolId: number, itemId?: number) {
    const params: any[] = [schoolId];
    let where = 't.school_id = ?';
    if (itemId) { where += ' AND t.item_id = ?'; params.push(itemId); }

    return this.txnRepo.query(
      `SELECT t.*, i.name AS item_name, i.unit, u.name AS created_by_name
       FROM inventory_transactions t
       JOIN inventory_items i ON i.id = t.item_id
       LEFT JOIN users u ON u.id = t.created_by
       WHERE ${where}
       ORDER BY t.created_at DESC
       LIMIT 200`,
      params,
    );
  }

  async getDashboard(schoolId: number) {
    const [totals] = await this.itemRepo.query(
      `SELECT COUNT(*) AS total_items,
              SUM(quantity) AS total_units,
              SUM(quantity * unit_price) AS stock_value,
              SUM(CASE WHEN quantity <= reorder_level THEN 1 ELSE 0 END) AS low_stock_items
       FROM inventory_items WHERE school_id = ? AND is_active = 1`,
      [schoolId],
    );
    return {
      total_items: Number(totals?.total_items) || 0,
      total_units: Number(totals?.total_units) || 0,
      stock_value: Number(totals?.stock_value) || 0,
      low_stock_items: Number(totals?.low_stock_items) || 0,
    };
  }
}
