import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { RecipesClient } from '../recipes/recipes.client';
import { QuizSubmitDto } from './dto/quiz-submit.dto';
interface QuizSkinResponse {
    palette: Record<string, string>;
    logoUrl: string | null;
    title: string;
    introCopy: string | null;
}
interface SubmitResult {
    orderId: string;
    checkoutUrl: string;
    barSlug: string;
}
export declare class BarQuizService {
    private readonly prisma;
    private readonly configService;
    private readonly ordersService;
    private readonly recipesClient;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService, ordersService: OrdersService, recipesClient: RecipesClient);
    getSkin(slug: string): Promise<QuizSkinResponse>;
    submit(slug: string, dto: QuizSubmitDto, requestId?: string): Promise<SubmitResult>;
    private buildOrderItems;
    private normalizeQuantity;
    private normalizeSku;
    private normalizeRecord;
    private isQuizEnabled;
}
export {};
