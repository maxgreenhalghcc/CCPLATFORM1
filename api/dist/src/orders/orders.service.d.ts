import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
declare const OrderStatusValues: {
    readonly created: "created";
    readonly paid: "paid";
    readonly cancelled: "cancelled";
    readonly fulfilled: "fulfilled";
};
type PrismaOrderStatus = typeof OrderStatusValues[keyof typeof OrderStatusValues];
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
            status: PrismaOrderStatus;
            createdAt: string;
            fulfilledAt: string | null;
        }[];
    }>;
    updateStatus(orderId: string, status: 'fulfilled', requester?: AuthenticatedUser): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.OrderStatus;
        fulfilledAt: string | null;
    }>;
    createForBar(barId: string, body: {
        items: {
            sku: string;
            qty: number;
        }[];
        total?: number;
    }, user: {
        sessionId?: string;
    } | any): Promise<{
        items: {
            id: string;
            createdAt: Date;
            sku: string;
            qty: number;
            updatedAt: Date;
            orderId: string;
        }[];
    } & {
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
