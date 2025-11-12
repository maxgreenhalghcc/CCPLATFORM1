export declare class CreateOrderDto {
    items: {
        sku: string;
        qty: number;
    }[];
    total?: number;
}
