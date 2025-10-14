import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

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

  async createCheckout(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true }
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const baseUrl =
      this.configService.get<string>('NEXT_PUBLIC_FRONTEND_URL') ??
      this.configService.get<string>('NEXTAUTH_URL') ??
      'http://localhost:3000';

    const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

    return {
      checkout_url: `${normalizedBase}/receipt?orderId=${orderId}`
    };
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
