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
            status: "created" | "paid" | "cancelled" | "fulfilled";
            createdAt: string;
            fulfilledAt: string | null;
        }[];
    }>;
    createForBar(id: string, body: CreateOrderBody, request: AuthenticatedRequest): Promise<{
        recipeJson: Prisma.JsonValue;
        id: string;
        barId: string;
        sessionId: string;
        recipeId: string | null;
        amount: Prisma.Decimal;
        currency: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        stripeSessionId: string | null;
        createdAt: Date;
        fulfilledAt: Date | null;
    }>;
}
export {};
