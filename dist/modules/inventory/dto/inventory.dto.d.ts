export declare class CreateCategoryDto {
    name: string;
}
export declare class CreateItemDto {
    name: string;
    category_id?: number;
    sku?: string;
    unit?: string;
    quantity?: number;
    reorder_level?: number;
    unit_price?: number;
    location?: string;
}
export declare class UpdateItemDto {
    name?: string;
    category_id?: number;
    sku?: string;
    unit?: string;
    reorder_level?: number;
    unit_price?: number;
    location?: string;
}
export declare class StockTransactionDto {
    item_id: number;
    type: 'in' | 'out';
    quantity: number;
    unit_price?: number;
    reference?: string;
    remarks?: string;
}
export declare class ListItemsQueryDto {
    search?: string;
    category_id?: number;
    low_stock?: string;
    page?: number;
    limit?: number;
}
