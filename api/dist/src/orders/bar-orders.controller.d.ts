import { OrdersService } from './orders.service';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
export declare class BarOrdersController {
    private readonly ordersService;
    private readonly allowedStatuses;
    constructor(ordersService: OrdersService);
    listForBar(id: string, status: string | undefined, request: AuthenticatedRequest): Promise<{
        items: {
            id: string;
            status: import(".prisma/client").$Enums.OrderStatus;
            createdAt: string;
            fulfilledAt: string | null;
        }[];
    }>;
}
