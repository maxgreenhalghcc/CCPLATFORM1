import {
  Injectable,
  InternalServerErrorException,
  NotFoundException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
        if (existing.url && existing.status !== 'expired') {
          return { checkout_url: existing.url };
        }
      } catch (error) {
        // Intentionally fall through to create a new session
      }
    }

    const successUrl = dto?.successUrl ?? this.resolveFrontendUrl(`/receipt?orderId=${order.id}`);
    const cancelUrl = dto?.cancelUrl ?? this.resolveFrontendUrl(
      `/b/${order.bar.slug}/quiz?sessionId=${order.sessionId}`
    );
    const currency = dto?.currency ?? order.currency;

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
            unit_amount: order.amountCents,
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
      data: { stripeSessionId: session.id }
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
      name: order.recipe.name,
      description: order.recipe.description,
      ingredients,
      method,
      glassware,
      garnish,
      warnings
    };
  }
}
