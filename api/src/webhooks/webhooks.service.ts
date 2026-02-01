import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, Prisma } from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {}

  private stripeClient?: Stripe;

  private getStripe(): Stripe {
    if (this.stripeClient) {
      return this.stripeClient;
    }

    const secretKey = this.configService.get<string>('stripe.secretKey');

    if (!secretKey) {
      throw new InternalServerErrorException('Stripe secret key is not configured');
    }

    this.stripeClient = new Stripe(secretKey, {
      // FIX(build): align Stripe API version with installed SDK typings.
      apiVersion: '2022-11-15'
    });

    return this.stripeClient;
  }

  async handleStripe(signature: string | undefined, payload: Buffer) {
    const webhookSecret = this.configService.get<string>('stripe.webhookSecret');
    const nodeEnv = this.configService.get<string>('nodeEnv');
    let event: Stripe.Event;

    if (!webhookSecret && nodeEnv !== 'development') {
      this.logger.error('Stripe webhook secret is not configured.');
      throw new BadRequestException('Stripe webhook secret is required');
    }

    if (webhookSecret) {
      if (!signature) {
        throw new BadRequestException('Missing Stripe signature header');
      }
      try {
        event = this.getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
      } catch (error) {
        this.logger.error(`Stripe webhook signature verification failed: ${error}`);
        throw new BadRequestException('Invalid Stripe signature');
      }
    } else {
      this.logger.warn('Stripe webhook secret is not configured. Parsing payload without verification.');
      try {
        event = JSON.parse(payload.toString('utf-8')) as Stripe.Event;
      } catch (error) {
        throw new BadRequestException('Unable to parse webhook payload');
      }
    }

    await this.processEvent(event);

    return {
      received: true
    };
  }

  private async processEvent(event: Stripe.Event) {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      // Prefer explicit metadata, but fall back to matching by Stripe session id.
      // This handles legacy sessions created before we reliably stamped metadata.
      let orderId = session.metadata?.orderId;

      if (!orderId && session.id) {
        const orderBySession = await this.prisma.order.findFirst({
          where: { stripeSessionId: session.id },
          select: { id: true }
        });
        orderId = orderBySession?.id;
      }

      if (!orderId) {
        this.logger.warn(
          `Checkout session completed without order metadata (sessionId=${session.id ?? 'unknown'}).`
        );
        return;
      }

      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, amount: true }
      });

      if (!order) {
        this.logger.warn(`Order ${orderId} not found for Stripe webhook.`);
        return;
      }

      const amount =
        session.amount_total != null
          ? new Prisma.Decimal(session.amount_total).dividedBy(100)
          : order.amount;
      const paymentStatus = session.payment_status ?? 'unknown';
      const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null;

      // Use the PaymentIntent when available (stable across retries), otherwise fall back to the Checkout Session id.
      // (Using event.id can create duplicate Payment rows if Stripe retries the webhook.)
      const intentReference = paymentIntentId ?? session.id ?? event.id;

      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.paid }
      });

      const existing = await this.prisma.payment.findFirst({
        where: { intentId: intentReference }
      });

      if (existing) {
        await this.prisma.payment.update({
          where: { id: existing.id },
          data: {
            amount,
            status: paymentStatus,
            raw: event as unknown as Prisma.InputJsonValue
          }
        });
        return;
      }

      await this.prisma.payment.create({
        data: {
          orderId,
          intentId: intentReference,
          amount,
          status: paymentStatus,
          raw: event as unknown as Prisma.InputJsonValue
        }
      });
    }
  }
}
