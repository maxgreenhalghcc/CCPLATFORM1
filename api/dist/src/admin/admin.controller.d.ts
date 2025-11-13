import { AdminService } from './admin.service';
import type { OrdersMetricsResponse, RevenueMetricsResponse } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getRevenue(barId?: string, range?: string): Promise<RevenueMetricsResponse>;
    getOrders(barId?: string, range?: string): Promise<OrdersMetricsResponse>;
    getIngredients(barId?: string, range?: string): {
        barId: string | null;
        range: string;
        top: {
            ingredient: string;
            usageCount: number;
        }[];
    };
}
