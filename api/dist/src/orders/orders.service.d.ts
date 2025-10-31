import { ConfigService } from '@nestjs/config';
import { OrderStatus as PrismaOrderStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
export declare class OrdersService {
    private readonly prisma;
    private readonly configService;
    constructor(prisma: PrismaService, configService: ConfigService);
    private stripeClient?;
    private getStripe;
    private resolveFrontendUrl;
    createCheckout(orderId: string, dto?: CreateCheckoutDto): Promise<{
        checkout_url: string;
    }>;
    getRecipe(orderId: string): Promise<{
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
    listForBar(barIdentifier: string, status?: PrismaOrderStatus, requester?: AuthenticatedUser): Promise<{
        items: {
            id: string;
            status: import(".prisma/client").$Enums.OrderStatus;
            createdAt: string;
            fulfilledAt: string | null;
        }[];
    }>;
    updateStatus(orderId: string, status: 'fulfilled', requester?: AuthenticatedUser): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        fulfilledAt: string | null;
    }>;
}
