import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(private readonly configService: ConfigService) {}

  handleStripe(signature: string | undefined, payload: unknown) {
    const webhookSecret = this.configService.get<string>('stripe.webhookSecret');
    if (!webhookSecret) {
      this.logger.warn('Stripe webhook secret is not configured. Skipping signature verification.');
    } else {
      this.logger.debug(`Received Stripe signature: ${signature ?? 'none'}`);
    }

    return {
      received: true
    };
  }
}
