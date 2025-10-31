/// <reference types="node" />
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class WebhooksService {
    private readonly configService;
    private readonly prisma;
    private readonly logger;
    constructor(configService: ConfigService, prisma: PrismaService);
    private stripeClient?;
    private getStripe;
    handleStripe(signature: string | undefined, payload: Buffer): Promise<{
        received: boolean;
    }>;
    private processEvent;
}
