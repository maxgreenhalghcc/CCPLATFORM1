import { PrismaService } from '../prisma/prisma.service';
export interface RevenueSeriesPoint {
    date: string;
    value: number;
}
export interface OrderSeriesPoint {
    date: string;
    count: number;
}
export interface RevenueMetricsResponse {
    barId: string | null;
    range: string;
    currency: string;
    total: number;
    series: RevenueSeriesPoint[];
}
export interface OrdersMetricsResponse {
    barId: string | null;
    range: string;
    total: number;
    series: OrderSeriesPoint[];
}
export declare class AdminService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private resolveRange;
    private toDateKey;
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
