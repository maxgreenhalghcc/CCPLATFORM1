import { Request } from 'express';
import { WebhooksService } from './webhooks.service';
export declare class WebhooksController {
    private readonly webhooksService;
    constructor(webhooksService: WebhooksService);
    handleStripe(request: Request): Promise<{
        received: boolean;
    }>;
}
