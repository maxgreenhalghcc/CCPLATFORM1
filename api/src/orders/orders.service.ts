import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus as PrismaOrderStatus } from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

interface NormalizedRecipeBody {
  ingredients?: unknown;
  method?: unknown;
  glassware?: unknown;
  garnish?: unknown;
  warnings?: unknown;
}

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
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
      apiVersion: '2023-10-16'
    });

    return this.stripeClient;
  }

  private resolveFrontendUrl(path: string) {
    const baseUrl =
      this.configService.get<string>('NEXT_PUBLIC_FRONTEND_URL') ??
      this.configService.get<string>('NEXTAUTH_URL') ??
      'http://localhost:3000';

    const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${normalizedBase}${path.startsWith('/') ? path : `/${path}`}`;
  }

  async createCheckout(orderId: string, dto?: CreateCheckoutDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        bar: {
          select: {
            slug: true,
            name: true
          }
        }
      }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const stripe = this.getStripe();

    if (order.stripeSessionId) {
      try {
        const existing = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
        if (existing.currency && existing.currency !== order.currency) {
          await this.prisma.order.update({
            where: { id: order.id },
            data: { currency: existing.currency.toLowerCase() }
          });
        }

        if (existing.url && existing.status !== 'expired') {
          return { checkout_url: existing.url };
        }
      } catch (error) {
        // Intentionally fall through to create a new session
      }
    }

    const successUrl =
      dto?.successUrl ?? this.resolveFrontendUrl(`/checkout/success?orderId=${order.id}`);
    const cancelUrl =
      dto?.cancelUrl ?? this.resolveFrontendUrl(`/checkout/cancel?orderId=${order.id}`);
    const currency = (dto?.currency ?? order.currency).toLowerCase();
    const amountInMinorUnits = Math.round(order.amount.mul(100).toNumber());

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      metadata: {
        orderId: order.id,
        barId: order.barId,
        sessionId: order.sessionId
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency,
            unit_amount: amountInMinorUnits,
            product_data: {
              name: `${order.bar.name} custom cocktail`
            }
          }
        }
      ],
      success_url: successUrl,
      cancel_url: cancelUrl
    });

    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        stripeSessionId: session.id,
        currency: (session.currency ?? currency).toLowerCase()
      }
    });

    if (!session.url) {
      throw new InternalServerErrorException('Stripe session did not return a URL');
    }

    return { checkout_url: session.url };
  }

  async getRecipe(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        recipe: true
      }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!order.recipe) {
      throw new NotFoundException('Recipe not found for order');
    }

    const body = (order.recipe.body as NormalizedRecipeBody) ?? {};

    const ingredients = Array.isArray(body.ingredients) ? body.ingredients : [];
    const method = typeof body.method === 'string' ? body.method : '';
    const glassware = typeof body.glassware === 'string' ? body.glassware : '';
    const garnish = typeof body.garnish === 'string' ? body.garnish : '';
    const warnings = Array.isArray(body.warnings) ? body.warnings : [];

    return {
      orderId: order.id,
      status: order.status,
      fulfilledAt: order.fulfilledAt ? order.fulfilledAt.toISOString() : null,
      name: order.recipe.name,
      description: order.recipe.description,
      ingredients,
      method,
      glassware,
      garnish,
      warnings
    };
  }

  async listForBar(barIdentifier: string, status?: PrismaOrderStatus) {
    const bar = await this.prisma.bar.findFirst({
      where: {
        OR: [{ id: barIdentifier }, { slug: barIdentifier }]
      }
    });

    if (!bar) {
      throw new NotFoundException('Bar not found');
    }

    if (status && !Object.values(PrismaOrderStatus).includes(status)) {
      throw new BadRequestException('Invalid status filter');
    }

    const orders = await this.prisma.order.findMany({
      where: {
        barId: bar.id,
        ...(status ? { status } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
      select: {
        id: true,
        status: true,
        createdAt: true,
        fulfilledAt: true
      }
    });

    return {
      items: orders.map((order) => ({
        id: order.id,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
        fulfilledAt: order.fulfilledAt?.toISOString() ?? null
      }))
    };
  }

  async updateStatus(orderId: string, status: 'fulfilled') {
    if (status !== 'fulfilled') {
      throw new BadRequestException('Unsupported status transition');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        status: true,
        fulfilledAt: true
      }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status === PrismaOrderStatus.fulfilled) {
      if (!order.fulfilledAt) {
        const updated = await this.prisma.order.update({
          where: { id: order.id },
          data: {
            fulfilledAt: new Date()
          },
          select: {
            id: true,
            status: true,
            fulfilledAt: true
          }
        });
        return {
          id: updated.id,
          status: updated.status,
          fulfilledAt: updated.fulfilledAt?.toISOString() ?? null
        };
      }

      return {
        id: order.id,
        status: order.status,
        fulfilledAt: order.fulfilledAt?.toISOString() ?? null
      };
    }

    if (order.status !== PrismaOrderStatus.paid) {
      throw new ConflictException('Only paid orders can be fulfilled');
    }

    const fulfilledAt = new Date();

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: PrismaOrderStatus.fulfilled,
        fulfilledAt
      },
      select: {
        id: true,
        status: true,
        fulfilledAt: true
      }
    });

    return {
      id: updated.id,
      status: updated.status,
      fulfilledAt: updated.fulfilledAt?.toISOString() ?? null
    };
  }
}
