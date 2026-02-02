import { Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';

import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('stripe')
  handleStripe(@Req() request: Request) {
    const signature = request.headers['stripe-signature'];
    return this.webhooksService.handleStripe(
      typeof signature === 'string' ? signature : Array.isArray(signature) ? signature[0] : undefined,
      request.body as Buffer
    );
  }
}
