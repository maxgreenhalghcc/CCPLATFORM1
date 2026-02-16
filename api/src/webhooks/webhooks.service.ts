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
import { OrderEventsService } from '../orders/order-events.service';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly orderEvents: OrderEventsService
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
    // We listen to multiple Stripe event types to reduce the chance that an order stays stuck in
    // `created` due to checkout timing differences (e.g. async card flows) or missing metadata.

    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object as Stripe.Checkout.Session;

      // Primary reconciliation path: metadata on the Checkout Session
      let orderId = session.metadata?.orderId;

      // Fallback: reconcile by Stripe session id (in case metadata was dropped)
      if (!orderId && session.id) {
        const match = await this.prisma.order.findFirst({
          where: { stripeSessionId: session.id },
          select: { id: true }
        });
        orderId = match?.id;
      }

      if (!orderId) {
        this.logger.warn(`Stripe ${event.type} received without order linkage (missing metadata + stripeSessionId match).`);
        return;
      }

      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, amount: true, stripeSessionId: true, status: true }
      });

      if (!order) {
        this.logger.warn(`Order ${orderId} not found for Stripe webhook.`);
        return;
      }

      // Keep the order's stripeSessionId in sync if Stripe reports a different session id.
      if (session.id && (!order.stripeSessionId || order.stripeSessionId !== session.id)) {
        await this.prisma.order.update({
          where: { id: orderId },
          data: { stripeSessionId: session.id }
        });
      }

      const amount =
        session.amount_total != null
          ? new Prisma.Decimal(session.amount_total).dividedBy(100)
          : order.amount;

      const paymentStatus = session.payment_status ?? 'unknown';
      const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null;
      const intentReference = paymentIntentId ?? event.id;

      // Only flip the order into `paid` when Stripe indicates payment has cleared.
      // NOTE: Stripe may report `no_payment_required` in some flows; treat it as paid.
      if (paymentStatus === 'paid' || paymentStatus === 'no_payment_required') {
        if (order.status !== OrderStatus.paid && order.status !== OrderStatus.fulfilled) {
          const updated = await this.prisma.order.update({
            where: { id: orderId },
            data: { status: OrderStatus.paid },
            select: { id: true, barId: true, createdAt: true, recipe: { select: { name: true } } }
          });

          this.orderEvents.emitOrderPaid({
            id: updated.id,
            barId: updated.barId,
            recipeName: updated.recipe?.name ?? 'Custom cocktail',
            status: 'paid',
            createdAt: updated.createdAt.toISOString(),
          });
        }
      } else {
        this.logger.warn(`Stripe checkout session completed but payment_status=${paymentStatus} for order ${orderId}. Leaving status as-is.`);
      }

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

      return;
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent;
      const orderId = intent.metadata?.orderId;

      if (!orderId) {
        this.logger.warn('payment_intent.succeeded received without orderId metadata');
        return;
      }

      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: { id: true, amount: true, status: true }
      });

      if (!order) {
        this.logger.warn(`Order ${orderId} not found for payment_intent webhook.`);
        return;
      }

      if (order.status !== OrderStatus.paid && order.status !== OrderStatus.fulfilled) {
        const updated = await this.prisma.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.paid },
          select: { id: true, barId: true, createdAt: true, recipe: { select: { name: true } } }
        });

        this.orderEvents.emitOrderPaid({
          id: updated.id,
          barId: updated.barId,
          recipeName: updated.recipe?.name ?? 'Custom cocktail',
          status: 'paid',
          createdAt: updated.createdAt.toISOString(),
        });
      }

      const intentId = intent.id;
      const amount = intent.amount_received != null
        ? new Prisma.Decimal(intent.amount_received).dividedBy(100)
        : order.amount;
      const status = intent.status ?? 'unknown';

      const existing = await this.prisma.payment.findFirst({
        where: { intentId }
      });

      if (existing) {
        await this.prisma.payment.update({
          where: { id: existing.id },
          data: {
            amount,
            status,
            raw: event as unknown as Prisma.InputJsonValue
          }
        });
        return;
      }

      await this.prisma.payment.create({
        data: {
          orderId,
          intentId,
          amount,
          status,
          raw: event as unknown as Prisma.InputJsonValue
        }
      });
    }
  }
}
