import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { OrdersService } from './orders.service';
import { Prisma } from '@prisma/client';
type CreateOrderBody = {
    items: {
        sku: string;
        qty: number;
    }[];
    total?: number;
};
export declare class BarOrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    listForBar(id: string, request: AuthenticatedRequest, status?: string): Promise<{
        items: {
            id: string;
            status: "created" | "paid" | "fulfilled" | "cancelled";
            createdAt: string;
            fulfilledAt: string | null;
        }[];
    }>;
    createForBar(id: string, body: CreateOrderBody, request: AuthenticatedRequest): Promise<{
        items: {
            id: string;
            createdAt: Date;
            orderId: string;
            sku: string;
            qty: number;
            updatedAt: Date;
        }[];
    } & {
        id: string;
        barId: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.OrderStatus;
        recipeJson: Prisma.JsonValue;
        sessionId: string | null;
        recipeId: string | null;
        amount: Prisma.Decimal;
        currency: string;
        stripeSessionId: string | null;
        fulfilledAt: Date | null;
    }>;
}
export {};
