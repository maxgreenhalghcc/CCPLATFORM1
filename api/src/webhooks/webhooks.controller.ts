import { Body, Controller, Headers, Post } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('stripe')
  handleStripe(@Headers('stripe-signature') signature: string | undefined, @Body() payload: unknown) {
    return this.webhooksService.handleStripe(signature, payload);
  }
}
