import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
<<<<<<< HEAD
import { Prisma } from '@prisma/client';
import { UserRole } from '../common/roles/user-role.enum';
=======
import { OrderStatus as PrismaOrderStatus, Prisma, QuizSessionStatus, UserRole } from '@prisma/client';
>>>>>>> pr-22
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import * as Sentry from '@sentry/node';
<<<<<<< HEAD

// Runtime-safe map of valid statuses + a type that matches your DB enum values
const OrderStatusValues = {
  created: 'created',
  paid: 'paid',
  cancelled: 'cancelled',
  fulfilled: 'fulfilled',
} as const;

type PrismaOrderStatus = typeof OrderStatusValues[keyof typeof OrderStatusValues];
=======
import { RecipesService } from '../recipes/recipes.service';
import { CreateOrderDto } from './dto/create-order.dto';
>>>>>>> pr-22

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
<<<<<<< HEAD
    private readonly configService: ConfigService
=======
    private readonly configService: ConfigService,
    private readonly recipes: RecipesService
>>>>>>> pr-22
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

<<<<<<< HEAD
   if (status && !Object.values(OrderStatusValues).includes(status as PrismaOrderStatus)) {
    throw new BadRequestException('Invalid status filter');
   }
=======
    if (status && !Object.values(PrismaOrderStatus).includes(status)) {
      throw new BadRequestException('Invalid status filter');
    }
>>>>>>> pr-22

    const orders = await this.prisma.order.findMany({
      where: {
        barId: bar.id,
<<<<<<< HEAD
        ...(status ? { status: status as PrismaOrderStatus } : {})
=======
        ...(status ? { status } : {})
>>>>>>> pr-22
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

<<<<<<< HEAD
  return {
    items: orders.map(
      (o: {
        id: string;
        status: PrismaOrderStatus;      // import this from @prisma/client
        createdAt: Date;
        fulfilledAt: Date | null;
      }) => ({
        id: o.id,
        status: o.status,
        createdAt: o.createdAt.toISOString(),
        fulfilledAt: o.fulfilledAt?.toISOString() ?? null,
      })
    ),
  };
=======
    return {
      items: orders.map((order) => ({
        id: order.id,
        status: order.status,
        createdAt: order.createdAt.toISOString(),
        fulfilledAt: order.fulfilledAt?.toISOString() ?? null
      }))
    };
>>>>>>> pr-22
  }

  async updateStatus(orderId: string, status: 'fulfilled', requester?: AuthenticatedUser) {
    if (status !== 'fulfilled') {
      throw new BadRequestException('Unsupported status transition');
    }

    return Sentry.startSpan({ name: 'orders.fulfill', op: 'service' }, async () => {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        select: {
          id: true,
          status: true,
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

<<<<<<< HEAD
      if (order.status === OrderStatusValues.fulfilled) {
=======
      if (order.status === PrismaOrderStatus.fulfilled) {
>>>>>>> pr-22
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

<<<<<<< HEAD
      if (order.status !== OrderStatusValues.paid) {
=======
      if (order.status !== PrismaOrderStatus.paid) {
>>>>>>> pr-22
        throw new ConflictException('Only paid orders can be fulfilled');
      }

      const fulfilledAt = new Date();

      const updated = await this.prisma.order.update({
        where: { id: order.id },
        data: {
<<<<<<< HEAD
          status: OrderStatusValues.fulfilled as PrismaOrderStatus,
=======
          status: PrismaOrderStatus.fulfilled,
>>>>>>> pr-22
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
    });
  }
<<<<<<< HEAD
  async createForBar(
    barId: string,
    body: { items: { sku: string; qty: number }[]; total?: number },
    user: { sessionId?: string } | any,
  ) {

      const sessionId: string | undefined = user?.sessionId ?? undefined;
      
      const order = await this.prisma.order.create({
        data: {
          barId,
          sessionId, 
          status: 'created',
          amount: body.total ?? 0,
          items: {
            create: body.items.map(i => ({
              sku: i.sku,
              qty: i.qty,
            })),
          },
        },
        include: { items: true },
      });

      return order;
=======

  // === Added for recipe integration ===
  async createForBar(barId: string, dto: CreateOrderDto) {
    const session = await this.prisma.quizSession.create({
      data: {
        barId,
        status: QuizSessionStatus.submitted,
      },
    });

    const items = Array.isArray(dto.items) ? dto.items : [];
    const amount = dto.total ?? 0;

    return this.prisma.order.create({
      data: {
        barId,
        sessionId: session.id,
        amount: new Prisma.Decimal(amount),
        currency: 'gbp',
        status: PrismaOrderStatus.created,
        items: {
          create: items.map((item) => ({ sku: item.sku, qty: item.qty })),
        },
      },
      include: { items: true },
    });
  }

  async checkout(orderId: string) {
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: PrismaOrderStatus.paid },
    });

    const recipe = await this.recipes.generateForOrder(orderId);

    return { ok: true, recipeId: recipe.id };
>>>>>>> pr-22
  }
}
