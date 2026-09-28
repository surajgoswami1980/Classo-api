import { InventoryService } from './inventory.service';
import { CreateCategoryDto, CreateItemDto, UpdateItemDto, StockTransactionDto, ListItemsQueryDto } from './dto/inventory.dto';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    dashboard(schoolId: number): Promise<{
        success: boolean;
        data: {
            total_items: number;
            total_units: number;
            stock_value: number;
            low_stock_items: number;
        };
    }>;
    listCategories(schoolId: number): Promise<{
        success: boolean;
        data: import("../../entities/inventory-category.entity").InventoryCategoryEntity[];
    }>;
    createCategory(schoolId: number, dto: CreateCategoryDto): Promise<{
        success: boolean;
        data: import("../../entities/inventory-category.entity").InventoryCategoryEntity;
    }>;
    listItems(schoolId: number, query: ListItemsQueryDto): Promise<{
        data: any[];
        total: number;
        page: number;
        limit: number;
        total_pages: number;
        success: boolean;
    }>;
    createItem(schoolId: number, dto: CreateItemDto): Promise<{
        success: boolean;
        data: import("../../entities/inventory-item.entity").InventoryItemEntity;
    }>;
    updateItem(schoolId: number, id: number, dto: UpdateItemDto): Promise<{
        success: boolean;
        data: import("../../entities/inventory-item.entity").InventoryItemEntity;
    }>;
    recordTransaction(schoolId: number, userId: number, dto: StockTransactionDto): Promise<{
        success: boolean;
        data: {
            transaction: import("../../entities/inventory-transaction.entity").InventoryTransactionEntity;
            new_quantity: number;
        };
    }>;
    listTransactions(schoolId: number, itemId?: number): Promise<{
        success: boolean;
        data: any;
    }>;
}
