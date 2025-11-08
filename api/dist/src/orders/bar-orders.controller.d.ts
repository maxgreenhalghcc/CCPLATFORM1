import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { OrdersService } from './orders.service';
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
}
