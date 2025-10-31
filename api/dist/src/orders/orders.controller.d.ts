import { OrdersService } from './orders.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-status.dto';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    createCheckout(id: string, dto?: CreateCheckoutDto): Promise<{
        checkout_url: string;
    }>;
    getRecipe(id: string): Promise<{
        orderId: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        fulfilledAt: string | null;
        name: string;
        description: string;
        ingredients: any[];
        method: string;
        glassware: string;
        garnish: string;
        warnings: any[];
    }>;
    updateStatus(id: string, dto: UpdateOrderStatusDto, request: AuthenticatedRequest): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        fulfilledAt: string | null;
    }>;
}
