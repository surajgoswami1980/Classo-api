"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const inventory_category_entity_1 = require("../../entities/inventory-category.entity");
const inventory_item_entity_1 = require("../../entities/inventory-item.entity");
const inventory_transaction_entity_1 = require("../../entities/inventory-transaction.entity");
let InventoryService = class InventoryService {
    constructor(categoryRepo, itemRepo, txnRepo) {
        this.categoryRepo = categoryRepo;
        this.itemRepo = itemRepo;
        this.txnRepo = txnRepo;
    }
    async listCategories(schoolId) {
        return this.categoryRepo.find({ where: { school_id: schoolId }, order: { name: 'ASC' } });
    }
    async createCategory(schoolId, dto) {
        return this.categoryRepo.save(this.categoryRepo.create({ school_id: schoolId, name: dto.name }));
    }
    async listItems(schoolId, query) {
        const page = Number(query.page) || 1;
        const limit = Number(query.limit) || 50;
        const qb = this.itemRepo
            .createQueryBuilder('i')
            .leftJoin(inventory_category_entity_1.InventoryCategoryEntity, 'c', 'c.id = i.category_id')
            .select(['i.*', 'c.name AS category_name'])
            .where('i.school_id = :schoolId', { schoolId });
        if (query.category_id)
            qb.andWhere('i.category_id = :cid', { cid: query.category_id });
        if (query.search)
            qb.andWhere('(i.name LIKE :s OR i.sku LIKE :s)', { s: `%${query.search}%` });
        if (query.low_stock === 'true')
            qb.andWhere('i.quantity <= i.reorder_level');
        const total = await qb.getCount();
        const data = await qb.orderBy('i.name', 'ASC').offset((page - 1) * limit).limit(limit).getRawMany();
        return { data, total, page, limit, total_pages: Math.ceil(total / limit) };
    }
    async createItem(schoolId, dto) {
        return this.itemRepo.save(this.itemRepo.create({
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
        }));
    }
    async updateItem(schoolId, id, dto) {
        const item = await this.itemRepo.findOne({ where: { id, school_id: schoolId } });
        if (!item)
            throw new common_1.NotFoundException('Item not found');
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
    async recordTransaction(schoolId, dto, userId) {
        const item = await this.itemRepo.findOne({ where: { id: dto.item_id, school_id: schoolId } });
        if (!item)
            throw new common_1.NotFoundException('Item not found');
        if (dto.quantity <= 0)
            throw new common_1.BadRequestException('Quantity must be greater than 0');
        if (dto.type === 'out' && item.quantity < dto.quantity) {
            throw new common_1.BadRequestException(`Insufficient stock. Available: ${item.quantity}`);
        }
        const txn = await this.txnRepo.save(this.txnRepo.create({
            school_id: schoolId,
            item_id: dto.item_id,
            type: dto.type,
            quantity: dto.quantity,
            unit_price: dto.unit_price ?? item.unit_price,
            reference: dto.reference,
            remarks: dto.remarks,
            created_by: userId,
        }));
        item.quantity += dto.type === 'in' ? dto.quantity : -dto.quantity;
        if (dto.type === 'in' && dto.unit_price)
            item.unit_price = dto.unit_price;
        await this.itemRepo.save(item);
        return { transaction: txn, new_quantity: item.quantity };
    }
    async listTransactions(schoolId, itemId) {
        const params = [schoolId];
        let where = 't.school_id = ?';
        if (itemId) {
            where += ' AND t.item_id = ?';
            params.push(itemId);
        }
        return this.txnRepo.query(`SELECT t.*, i.name AS item_name, i.unit, u.name AS created_by_name
       FROM inventory_transactions t
       JOIN inventory_items i ON i.id = t.item_id
       LEFT JOIN users u ON u.id = t.created_by
       WHERE ${where}
       ORDER BY t.created_at DESC
       LIMIT 200`, params);
    }
    async getDashboard(schoolId) {
        const [totals] = await this.itemRepo.query(`SELECT COUNT(*) AS total_items,
              SUM(quantity) AS total_units,
              SUM(quantity * unit_price) AS stock_value,
              SUM(CASE WHEN quantity <= reorder_level THEN 1 ELSE 0 END) AS low_stock_items
       FROM inventory_items WHERE school_id = ? AND is_active = 1`, [schoolId]);
        return {
            total_items: Number(totals?.total_items) || 0,
            total_units: Number(totals?.total_units) || 0,
            stock_value: Number(totals?.stock_value) || 0,
            low_stock_items: Number(totals?.low_stock_items) || 0,
        };
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(inventory_category_entity_1.InventoryCategoryEntity)),
    __param(1, (0, typeorm_1.InjectRepository)(inventory_item_entity_1.InventoryItemEntity)),
    __param(2, (0, typeorm_1.InjectRepository)(inventory_transaction_entity_1.InventoryTransactionEntity)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map