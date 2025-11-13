import {
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, QuizSessionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import { RecipesClient, RecipeBuildResult } from '../recipes/recipes.client';
import { QuizSubmitDto } from './dto/quiz-submit.dto';

interface QuizSkinResponse {
  palette: Record<string, string>;
  logoUrl: string | null;
  title: string;
  introCopy: string | null;
}

interface SubmitResult {
  orderId: string;
  checkoutUrl: string;
  barSlug: string;
}

const DEFAULT_THEME = {
  primary: '#2f27ce',
  background: '#050315',
  foreground: '#fbfbfe',
  card: '#121129',
};

const DEFAULT_PALETTE = {
  primary: '#2f27ce',
  secondary: '#050315',
  accent: '#dedcff',
};

@Injectable()
export class BarQuizService {
  private readonly logger = new Logger(BarQuizService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly ordersService: OrdersService,
    private readonly recipesClient: RecipesClient,
  ) {}

  async getSkin(slug: string): Promise<QuizSkinResponse> {
    if (!this.isQuizEnabled()) {
      throw new NotFoundException('Quiz is not enabled');
    }

    const bar = await this.prisma.bar.findFirst({
      where: { slug, active: true },
      include: { settings: true },
    });

    if (!bar || !bar.settings) {
      throw new NotFoundException('Bar not found');
    }

    const theme = {
      ...DEFAULT_THEME,
      ...(bar.settings.theme as Record<string, string> | null | undefined),
    };

    const paletteRecord = this.normalizeRecord(bar.settings.brandPalette ?? null);
    const primary =
      paletteRecord.primary ?? paletteRecord.dominant ?? paletteRecord.main ?? theme.primary;
    const secondary =
      paletteRecord.secondary ?? paletteRecord.background ?? paletteRecord.support ?? theme.background;
    const accent = paletteRecord.accent ?? paletteRecord.highlight ?? theme.card;
    const palette = {
      primary,
      secondary,
      accent,
      background: theme.background,
      foreground: theme.foreground,
    };

    return {
      palette,
      logoUrl: bar.settings.logoUrl ?? null,
      title: bar.name,
      introCopy: bar.settings.introText ?? null,
    };
  }

  async submit(slug: string, dto: QuizSubmitDto, requestId?: string): Promise<SubmitResult> {
    if (!this.isQuizEnabled()) {
      throw new NotFoundException('Quiz is not enabled');
    }

    const bar = await this.prisma.bar.findFirst({
      where: { slug, active: true },
      include: { settings: true },
    });

    if (!bar || !bar.settings) {
      throw new NotFoundException('Bar not found');
    }

    const session = await this.prisma.quizSession.create({
      data: {
        barId: bar.id,
        status: QuizSessionStatus.submitted,
        answerRecord: {
          answers: dto.answers,
          customer: dto.customer,
          notes: dto.notes ?? '',
        },
      },
    });

    let recipe: RecipeBuildResult;

    try {
      recipe = await this.recipesClient.buildRecipe(bar.id, dto.answers, requestId);
    } catch (error) {
      this.logger.error('Recipe generation failed', error instanceof Error ? error.message : String(error));
      throw new ServiceUnavailableException('Unable to generate recipe');
    }

    const recipeBody = {
      ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
      method: recipe.method ?? '',
      glassware: recipe.glassware ?? '',
      garnish: recipe.garnish ?? '',
      warnings: [],
      notes: recipe.notes ?? '',
    };

    const storedRecipe = await this.prisma.recipe.create({
      data: {
        barId: bar.id,
        sessionId: session.id,
        name: recipe.cocktailName ?? 'Custom cocktail',
        description: recipe.notes ?? '',
        body: recipeBody,
        result: recipe,
      },
    });

    const price = bar.settings.pricingPounds ?? new Prisma.Decimal(0);
    const items = this.buildOrderItems(recipe);

    const order = await this.ordersService.createFromRecipe({
      barId: bar.id,
      sessionId: session.id,
      recipeId: storedRecipe.id,
      amount: price,
      currency: 'gbp',
      items,
      recipeJson: recipe,
    });

    const paymentsEnabled = this.configService.get<boolean>('features.enablePayment') ?? true;

    if (!paymentsEnabled) {
      return {
        orderId: order.id,
        checkoutUrl: `/receipt?orderId=${order.id}`,
        barSlug: bar.slug,
      };
    }

    const checkout = await this.ordersService.createCheckout(order.id);

    return {
      orderId: order.id,
      checkoutUrl: checkout.checkout_url,
      barSlug: bar.slug,
    };
  }

  private buildOrderItems(recipe: RecipeBuildResult) {
    const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];

    if (ingredients.length === 0) {
      return [
        {
          sku: 'CUSTOM-COCKTAIL',
          qty: 1,
        },
      ];
    }

    return ingredients.map((ingredient) => ({
      sku: this.normalizeSku(ingredient.sku ?? ingredient.name ?? 'INGREDIENT'),
      qty: this.normalizeQuantity(ingredient.qtyMl),
    }));
  }

  private normalizeQuantity(qtyMl?: number) {
    if (typeof qtyMl !== 'number' || Number.isNaN(qtyMl)) {
      return 1;
    }

    const units = Math.max(1, Math.round(qtyMl / 25));
    return units;
  }

  private normalizeSku(value: string) {
    return value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '-').slice(0, 64) || 'INGREDIENT';
  }

  private normalizeRecord(value: Prisma.JsonValue | null) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { ...DEFAULT_PALETTE } as Record<string, string>;
    }

    const entries = Object.entries(value as Record<string, unknown>).reduce<Record<string, string>>(
      (acc, [key, current]) => {
        if (typeof current !== 'string') {
          return acc;
        }
        const trimmed = current.trim();
        if (trimmed.length === 0) {
          return acc;
        }
        acc[key] = trimmed;
        return acc;
      },
      { ...DEFAULT_PALETTE },
    );

    return entries;
  }

  private isQuizEnabled() {
    return this.configService.get<boolean>('quiz.enabled') ?? false;
  }
}
