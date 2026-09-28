import { Repository } from 'typeorm';
import { InventoryCategoryEntity } from '../../entities/inventory-category.entity';
import { InventoryItemEntity } from '../../entities/inventory-item.entity';
import { InventoryTransactionEntity } from '../../entities/inventory-transaction.entity';
import { CreateCategoryDto, CreateItemDto, UpdateItemDto, StockTransactionDto, ListItemsQueryDto } from './dto/inventory.dto';
export declare class InventoryService {
    private categoryRepo;
    private itemRepo;
    private txnRepo;
    constructor(categoryRepo: Repository<InventoryCategoryEntity>, itemRepo: Repository<InventoryItemEntity>, txnRepo: Repository<InventoryTransactionEntity>);
    listCategories(schoolId: number): Promise<InventoryCategoryEntity[]>;
    createCategory(schoolId: number, dto: CreateCategoryDto): Promise<InventoryCategoryEntity>;
    listItems(schoolId: number, query: ListItemsQueryDto): Promise<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        total_pages: number;
    }>;
    createItem(schoolId: number, dto: CreateItemDto): Promise<InventoryItemEntity>;
    updateItem(schoolId: number, id: number, dto: UpdateItemDto): Promise<InventoryItemEntity>;
    recordTransaction(schoolId: number, dto: StockTransactionDto, userId: number): Promise<{
        transaction: InventoryTransactionEntity;
        new_quantity: number;
    }>;
    listTransactions(schoolId: number, itemId?: number): Promise<any>;
    getDashboard(schoolId: number): Promise<{
        total_items: number;
        total_units: number;
        stock_value: number;
        low_stock_items: number;
    }>;
}
