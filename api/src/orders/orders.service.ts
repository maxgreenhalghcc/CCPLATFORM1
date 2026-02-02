import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus as PrismaOrderStatus, Prisma, UserRole } from '@prisma/client';
import Stripe from 'stripe';
import * as Sentry from '@sentry/node';

import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

interface NormalizedRecipeBody {
  ingredients?: unknown;
  method?: unknown;
  glassware?: unknown;
  garnish?: unknown;
  warnings?: unknown;
}

interface CreateOrderItemInput {
  sku: string;
  qty: number;
}

interface CreateOrderFromRecipeParams {
  barId: string;
  sessionId: string;
  recipeId: string;
  amount: Prisma.Decimal;
  currency?: string;
  items: CreateOrderItemInput[];
  recipeJson: unknown;
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
      // FIX(build): align Stripe API version with installed SDK typings.
      apiVersion: '2022-11-15'
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

  async createFromRecipe(params: CreateOrderFromRecipeParams) {
    if (!Array.isArray(params.items) || params.items.length === 0) {
      throw new BadRequestException('Order requires at least one item');
    }

    return this.prisma.order.create({
      data: {
        barId: params.barId,
        sessionId: params.sessionId,
        recipeId: params.recipeId,
        amount: params.amount,
        currency: (params.currency ?? 'gbp').toLowerCase(),
        status: PrismaOrderStatus.created,
        recipeJson: params.recipeJson as Prisma.InputJsonValue,
        items: {
          create: params.items.map((item) => ({
            sku: item.sku,
            qty: item.qty,
          })),
        },
      },
    });
  }

  async createCheckout(orderId: string, dto?: CreateCheckoutDto) {
    return Sentry.startSpan({ name: 'orders.checkout', op: 'service' }, async () => {
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



      let session;

      try {
        session = await stripe.checkout.sessions.create({
          mode: 'payment',
          payment_method_types: ['card'],
          metadata: {
            // Stripe metadata values must be strings, so we coerce them
            orderId: String(order.id),
            barId: String(order.barId),
            sessionId: String(order.sessionId),
          },
          line_items: [
            {
              quantity: 1,
              price_data: {
                currency,
                unit_amount: amountInMinorUnits,
                product_data: {
                  name: `${order.bar.name} custom cocktail`,
                },
              },
            },
          ],
          success_url: successUrl,
          cancel_url: cancelUrl,
        });
      } catch (error) {
        const err = error as unknown as { message?: unknown; type?: unknown; code?: unknown };
        console.error('Stripe error creating checkout session', {
          message: err?.message,
          type: err?.type,
          code: err?.code,
          raw: error,
        });

        // Re-throw so the API still returns 500, but with a useful log
        throw error;
      }


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
    });
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

  async listForBar(
    barIdentifier: string,
    status?: PrismaOrderStatus,
    requester?: AuthenticatedUser
  ) {
    const bar = await this.prisma.bar.findFirst({
      where: {
        OR: [{ id: barIdentifier }, { slug: barIdentifier }]
      }
    });

    if (!bar) {
      throw new NotFoundException('Bar not found');
    }

    if (requester) {
      if (requester.role === UserRole.staff) {
        if (!requester.barId || requester.barId !== bar.id) {
          throw new ForbiddenException('Staff users can only access their assigned bar');
        }
      } else if (requester.role !== UserRole.admin) {
        throw new ForbiddenException('User is not permitted to view orders');
      }
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
        claimedAt: true,
        claimedBy: true,
        fulfilledAt: true,
        recipe:{
          select: { name: true },
        }
      }
    });

    return {
      items: orders.map((order) => ({
        id: order.id,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
        claimedAt: order.claimedAt?.toISOString() ?? null,
        claimedBy: order.claimedBy,
        fulfilledAt: order.fulfilledAt?.toISOString() ?? null,
        recipeName: order.recipe?.name ?? 'Custom cocktail',
      }))
    };
  }

  async updateStatus(orderId: string, status: 'making' | 'fulfilled', requester?: AuthenticatedUser) {
    if (status !== 'making' && status !== 'fulfilled') {
      throw new BadRequestException('Unsupported status transition');
    }

    const operationName = status === 'making' ? 'orders.claim' : 'orders.fulfill';
    return Sentry.startSpan({ name: operationName, op: 'service' }, async () => {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
          claimedAt: true,
          claimedBy: true,
          fulfilledAt: true,
          barId: true
        }
      });

      if (!order) {
        throw new NotFoundException('Order not found');
      }

      if (requester) {
        if (requester.role === UserRole.staff) {
          if (!requester.barId || requester.barId !== order.barId) {
            throw new ForbiddenException('Staff users can only update orders for their bar');
          }
        } else if (requester.role !== UserRole.admin) {
          throw new ForbiddenException('User is not permitted to update orders');
        }
      }

      // Handle transition to 'making' (claiming)
      if (status === 'making') {
        if (order.status !== PrismaOrderStatus.paid) {
          throw new ConflictException('Only paid orders can be claimed');
        }

        const claimedAt = new Date();
        const claimedBy = requester?.name ?? requester?.id ?? 'Unknown staff';

        const updated = await this.prisma.order.update({
          where: { id: order.id },
          data: {
            status: PrismaOrderStatus.making,
            claimedAt,
            claimedBy
          },
          select: {
            id: true,
            status: true,
            claimedAt: true,
            claimedBy: true,
            fulfilledAt: true
          }
        });

        return {
          id: updated.id,
          status: updated.status,
          claimedAt: updated.claimedAt?.toISOString() ?? null,
          claimedBy: updated.claimedBy,
          fulfilledAt: updated.fulfilledAt?.toISOString() ?? null
        };
      }

      // Handle transition to 'fulfilled'
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
              claimedAt: true,
              claimedBy: true,
              fulfilledAt: true
            }
          });

          return {
            id: updated.id,
            status: updated.status,
            claimedAt: updated.claimedAt?.toISOString() ?? null,
            claimedBy: updated.claimedBy,
            fulfilledAt: updated.fulfilledAt?.toISOString() ?? null
          };
        }

        return {
          id: order.id,
          status: order.status,
          claimedAt: order.claimedAt?.toISOString() ?? null,
          claimedBy: order.claimedBy,
          fulfilledAt: order.fulfilledAt?.toISOString() ?? null
        };
      }

      if (order.status !== PrismaOrderStatus.paid && order.status !== PrismaOrderStatus.making) {
        throw new ConflictException('Only paid or making orders can be fulfilled');
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
          claimedAt: true,
          claimedBy: true,
          fulfilledAt: true
        }
      });

      return {
        id: updated.id,
        status: updated.status,
        claimedAt: updated.claimedAt?.toISOString() ?? null,
        claimedBy: updated.claimedBy,
        fulfilledAt: updated.fulfilledAt?.toISOString() ?? null
      };
    });
  }

  // inside OrdersService
  async saveContact(orderId: string, contact: string) {
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        // 👇 adjust this field name to match your schema
        contact,
      },
    });
  }


}
