import { HttpService } from '@nestjs/axios';
<<<<<<< HEAD
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
=======
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus } from '@prisma/client';
import { firstValueFrom, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PrismaService } from '../prisma/prisma.service';
>>>>>>> pr-22
import { GenerateRecipeDto } from './dto/generate-recipe.dto';

@Injectable()
export class RecipesService {
  private readonly logger = new Logger(RecipesService.name);
<<<<<<< HEAD

  constructor(private readonly http: HttpService, private readonly configService: ConfigService) {}

  async generate(dto: GenerateRecipeDto, requestId?: string) {
    const url = this.configService.get<string>('recipeService.url') ?? 'http://localhost:5000';
=======
  private readonly recipeApiUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.recipeApiUrl = this.configService.get<string>('RECIPE_API_URL') ?? '';
  }

  async generate(dto: GenerateRecipeDto, requestId?: string) {
    const url =
      this.recipeApiUrl ||
      this.configService.get<string>('recipeService.url') ||
      'http://localhost:5000';
>>>>>>> pr-22

    const payload = {
      bar_id: dto.barId,
      session_id: dto.sessionId,
      seed: dto.seed ?? Date.now(),
<<<<<<< HEAD
      quiz: dto.quiz ?? {}
=======
      quiz: dto.quiz ?? {},
>>>>>>> pr-22
    };

    const headers: Record<string, string> = {};

    if (requestId) {
      headers['x-request-id'] = requestId;
    }

    const response$ = this.http.post(`${url}/generate`, payload, { headers }).pipe(
      map((response) => response.data),
      catchError((error) => {
        this.logger.error('Recipe generation failed', error?.message ?? error);
        return of({
          id: `recipe_${dto.sessionId}`,
          name: 'Fallback Cocktail',
          method: 'Stir with ice and strain into a rocks glass.',
          glassware: 'Rocks',
          garnish: 'Orange twist',
          ingredients: [
            { name: 'Whiskey', amount: '50ml' },
            { name: 'Sweet vermouth', amount: '25ml' },
<<<<<<< HEAD
            { name: 'Aromatic bitters', amount: '2 dashes' }
          ]
        });
      })
=======
            { name: 'Aromatic bitters', amount: '2 dashes' },
          ],
        });
      }),
>>>>>>> pr-22
    );

    return firstValueFrom(response$);
  }
<<<<<<< HEAD
=======

  async generateForOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!this.recipeApiUrl) {
      throw new InternalServerErrorException('Recipe API URL is not configured');
    }

    const payload = {
      barId: order.barId,
      items: order.items.map((item) => ({ sku: item.sku, qty: item.qty })),
    };

    const response = await firstValueFrom(this.http.post(this.recipeApiUrl, payload));
    const data = response.data ?? {};

    const abvEstimate =
      typeof data?.abv_estimate === 'number'
        ? (data.abv_estimate as number)
        : typeof data?.abvEstimate === 'number'
        ? (data.abvEstimate as number)
        : null;

    const recipe = await this.prisma.recipe.create({
      data: {
        barId: order.barId,
        sessionId: order.sessionId,
        name: typeof data?.name === 'string' ? data.name : 'Generated Recipe',
        description:
          typeof data?.description === 'string' ? data.description : 'Generated cocktail',
        body: data,
        result: data,
        abvEstimate: abvEstimate ?? undefined,
      },
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.fulfilled,
        recipeId: recipe.id,
        fulfilledAt: new Date(),
      },
    });

    return recipe;
  }
>>>>>>> pr-22
}
