import { NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import type { Request } from 'express';
import type { QuizSubmitDto } from '../../src/bars/dto/quiz-submit.dto';
import { BarQuizController } from '../../src/bars/bar-quiz.controller';
import { BarQuizService } from '../../src/bars/bar-quiz.service';
import type { PrismaService } from '../../src/prisma/prisma.service';
import type { OrdersService } from '../../src/orders/orders.service';
import type { RecipesClient } from '../../src/recipes/recipes.client';

describe('BarQuizController', () => {
  const baseDto: QuizSubmitDto = {
    customer: { name: 'Ada Lovelace', email: 'ada@example.com' },
    answers: {
      season: 'summer',
      house: 'beach',
      taste: 'bold',
      music: 'jazz',
      scent: 'citrus',
      base: 'gin',
      afterMeal: 'fruit',
      colour: 'pink',
      sweetness: 'medium',
    },
    notes: '',
  };

  it('forwards submit calls to the service with the request id', async () => {
    const service: Partial<BarQuizService> = {
      submit: jest.fn().mockResolvedValue({ orderId: 'ord_1', checkoutUrl: 'http://stripe', barSlug: 'demo-bar' }),
    };
    const controller = new BarQuizController(service as BarQuizService);

    const request = { requestId: 'req-123' } as unknown as Request;
    const result = await controller.submit('demo-bar', baseDto, request);

    expect(result).toEqual({ orderId: 'ord_1', checkoutUrl: 'http://stripe', barSlug: 'demo-bar' });
    expect((service.submit as jest.Mock).mock.calls[0][2]).toBe('req-123');
  });

  it('propagates service errors during submission', async () => {
    const service: Partial<BarQuizService> = {
      submit: jest.fn().mockRejectedValue(new ServiceUnavailableException('down')),
    };
    const controller = new BarQuizController(service as BarQuizService);

    await expect(controller.submit('demo-bar', baseDto, {} as Request)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('propagates not found errors for skin lookup', async () => {
    const service: Partial<BarQuizService> = {
      getSkin: jest.fn().mockRejectedValue(new NotFoundException('missing')),
      submit: jest.fn(),
    };
    const controller = new BarQuizController(service as BarQuizService);

    await expect(controller.getSkin('unknown-bar')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('BarQuizService', () => {
  let prisma: jest.Mocked<PrismaService>;
  let config: jest.Mocked<ConfigService>;
  let orders: jest.Mocked<OrdersService>;
  let recipes: jest.Mocked<RecipesClient>;
  let service: BarQuizService;

  const answers = {
    season: 'summer',
    house: 'beach',
    taste: 'bold',
    music: 'jazz',
    scent: 'citrus',
    base: 'gin',
    afterMeal: 'fruit',
    colour: 'pink',
    sweetness: 'medium',
  };

  beforeEach(() => {
    prisma = {
      bar: { findFirst: jest.fn() },
      quizSession: { create: jest.fn() },
      recipe: { create: jest.fn() },
    } as unknown as jest.Mocked<PrismaService>;

    config = {
      get: jest.fn((key: string) => {
        if (key === 'quiz.enabled') {
          return true;
        }
        if (key === 'features.enablePayment') {
          return true;
        }
        if (key === 'quiz.recipeApiBase') {
          return 'https://ccrecipebuilder.onrender.com';
        }
        if (key === 'quiz.mockRecipes') {
          return false;
        }
        return undefined;
      }),
    } as unknown as jest.Mocked<ConfigService>;

    orders = {
      createFromRecipe: jest.fn().mockResolvedValue({ id: 'ord_1', barId: 'bar_1' }),
      createCheckout: jest.fn().mockResolvedValue({ checkout_url: 'http://stripe' }),
    } as unknown as jest.Mocked<OrdersService>;

    recipes = {
      buildRecipe: jest.fn().mockResolvedValue({
        cocktailName: 'Summer Jazz',
        glassware: 'Coupe',
        method: 'Shake',
        garnish: 'Grapefruit twist',
        ingredients: [
          { sku: 'GIN-BASE', name: 'Gin', qtyMl: 50 },
          { sku: 'CITRUS', name: 'Citrus cordial', qtyMl: 20 },
        ],
      }),
    } as unknown as jest.Mocked<RecipesClient>;

    service = new BarQuizService(prisma, config, orders, recipes);

    prisma.bar.findFirst.mockResolvedValue({
      id: 'bar_1',
      slug: 'demo-bar',
      active: true,
      name: 'Demo Bar',
      settings: {
        theme: { primary: '#2f27ce', background: '#050315', foreground: '#fbfbfe' },
        introText: 'Welcome',
        pricingPounds: new Prisma.Decimal(12),
        brandPalette: { primary: '#2f27ce', secondary: '#050315', accent: '#dedcff' },
        logoUrl: 'https://logo',
      },
    } as any);

    prisma.quizSession.create.mockResolvedValue({ id: 'quiz_1' } as any);
    prisma.recipe.create.mockResolvedValue({ id: 'recipe_1' } as any);
  });

  it('creates an order and checkout URL on submit', async () => {
    const result = await service.submit('demo-bar', { customer: { name: 'Ada' }, answers, notes: '' });

    expect(prisma.quizSession.create).toHaveBeenCalled();
    expect(recipes.buildRecipe).toHaveBeenCalled();
    expect(orders.createFromRecipe).toHaveBeenCalledWith(
      expect.objectContaining({ barId: 'bar_1', recipeId: 'recipe_1', recipeJson: expect.any(Object) }),
    );
    expect(orders.createCheckout).toHaveBeenCalledWith('ord_1');
    expect(result).toEqual({ orderId: 'ord_1', checkoutUrl: 'http://stripe', barSlug: 'demo-bar' });
  });

  it('throws when the bar is not found', async () => {
    prisma.bar.findFirst.mockResolvedValueOnce(null);

    await expect(service.getSkin('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws when quiz is disabled', async () => {
    config.get.mockImplementation((key: string) => {
      if (key === 'quiz.enabled') {
        return false;
      }
      return undefined;
    });

    await expect(service.submit('demo-bar', { customer: { name: 'Ada' }, answers, notes: '' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('falls back with ServiceUnavailable when recipe build fails and prevents order creation', async () => {
    recipes.buildRecipe.mockRejectedValue(new Error('boom'));

    await expect(
      service.submit('demo-bar', { customer: { name: 'Ada' }, answers, notes: '' }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
    expect(orders.createFromRecipe).not.toHaveBeenCalled();
  });
});
