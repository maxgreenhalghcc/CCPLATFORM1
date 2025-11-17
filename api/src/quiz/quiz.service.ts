import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrderStatus, Prisma, QuizSessionStatus } from '@prisma/client';
import { lastValueFrom } from 'rxjs';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { RecordAnswerDto } from './dto/record-answer.dto';
import { signJwtHS256 } from '../common/jwt';
import * as Sentry from '@sentry/node';

interface NormalizedAnswer {
  questionId: string;
  value: { choice: string };
}

interface RecipeEngineResponse {
  name: string;
  description: string;
  ingredients: unknown[];
  method: string;
  glassware: string;
  garnish: string;
  warnings: unknown[];
  abv_estimate?: number | null;
}

function randomChoice<T>(options: T[]): T {
  return options[Math.floor(Math.random() * options.length)];
}

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  // Helper to read a single answer's choice value
  private getAnswerChoice(
    answers: NormalizedAnswer[],
    id: string,
  ): string | undefined {
    const found = answers.find((a) => a.questionId === id);
    return found?.value.choice;
  }

  async createSession(slug: string, _dto: CreateSessionDto) {
    const bar = await this.prisma.bar.findFirst({
      where: {
        slug,
        active: true,
      },
      select: { id: true },
    });

    if (!bar) {
      throw new NotFoundException('Bar not found');
    }

    const session = await this.prisma.quizSession.create({
      data: {
        barId: bar.id,
      },
    });

    return {
      sessionId: session.id,
    };
  }

  async recordAnswer(sessionId: string, dto: RecordAnswerDto) {
    const session = await this.prisma.quizSession.findUnique({
      where: { id: sessionId },
      select: { id: true, answerRecord: true },
    });

    if (!session) {
      throw new NotFoundException('Quiz session not found');
    }

    const answer: NormalizedAnswer = {
      questionId: dto.questionId,
      value: this.normalizeAnswerValue(dto.value?.choice),
    };

    await this.persistAnswers(session, [answer]);

    return { status: 'recorded' };
  }

  async submit(sessionId: string, dto: SubmitQuizDto, requestId?: string) {
    return Sentry.startSpan(
      { name: 'quiz.submit', op: 'service' },
      async () => {
        const session = await this.prisma.quizSession.findUnique({
          where: { id: sessionId },
          include: {
            bar: {
              include: {
                settings: true,
              },
            },
          },
        });

        if (!session) {
          throw new NotFoundException('Quiz session not found');
        }

        if (dto.answers?.length) {
          const normalized = dto.answers.map((answer) => ({
            questionId: answer.questionId,
            value: this.normalizeAnswerValue(answer.value.choice),
          }));

          await this.persistAnswers(
            { id: session.id, answerRecord: session.answerRecord ?? null },
            normalized,
          );
        }

        const existingOrder = await this.prisma.order.findFirst({
          where: { sessionId: session.id },
          select: { id: true },
        });

        if (existingOrder) {
          return { orderId: existingOrder.id };
        }

        const storedAnswers = await this.prisma.quizAnswer.findMany({
          where: { sessionId: session.id },
        });

        const normalizedAnswers: NormalizedAnswer[] = storedAnswers.map(
          (entry) => ({
            questionId: entry.questionId,
            value: this.normalizeStoredAnswer(entry.value),
          }),
        );

        const defaultPrice = new Prisma.Decimal(12);
        const amount = session.bar.settings?.pricingPounds ?? defaultPrice;

        const order = await this.prisma.order.create({
          data: {
            barId: session.barId,
            sessionId: session.id,
            amount,
            currency: 'gbp',
            status: OrderStatus.created,
          },
        });

        try {
          const ingredientWhitelist = await this.loadIngredientWhitelist(
            session.barId,
          );

          const recipeResponse = await this.requestRecipe(
            session.bar.slug,
            session.id,
            normalizedAnswers,
            ingredientWhitelist,
            requestId,
          );

          const cocktailName =
            dto.contact?.trim() || recipeResponse.name || 'Custom Cocktail';

          const recipe = await this.prisma.recipe.create({
            data: {
              barId: session.barId,
              sessionId: session.id,
              name: cocktailName,
              description:
                recipeResponse.description ??
                'A bespoke cocktail created from your quiz answers.',
              body: {
                ingredients: recipeResponse.ingredients ?? [],
                method: recipeResponse.method ?? '',
                glassware: recipeResponse.glassware ?? '',
                garnish: recipeResponse.garnish ?? '',
                warnings: recipeResponse.warnings ?? [],
              } as Prisma.JsonObject,
              abvEstimate: recipeResponse.abv_estimate ?? null,
            },
          });

          await this.prisma.order.update({
            where: { id: order.id },
            data: { recipeId: recipe.id },
          });

          await this.prisma.quizSession.update({
            where: { id: session.id },
            data: { status: QuizSessionStatus.submitted },
          });

          return { orderId: order.id };
        } catch (error) {
          await this.prisma.order
            .delete({ where: { id: order.id } })
            .catch((deleteError) => {
              const rollbackMessage =
                deleteError instanceof Error
                  ? deleteError.message
                  : String(deleteError);
              this.logger.error(
                `Failed to rollback order ${order.id}: ${rollbackMessage}`,
                deleteError instanceof Error ? deleteError.stack : undefined,
              );
            });

          await this.prisma.quizSession.update({
            where: { id: session.id },
            data: { status: QuizSessionStatus.in_progress },
          });

          if (error instanceof NotFoundException) {
            throw error;
          }

          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.logger.error(
            `Recipe generation failed: ${errorMessage}`,
            error instanceof Error ? error.stack : undefined,
          );
          throw new InternalServerErrorException('Failed to generate recipe');
        }
      },
    );
  }

  private normalizeAnswerValue(choice?: string) {
    if (typeof choice === 'string') {
      return { choice: choice.trim() };
    }

    return { choice: '' };
  }

  private normalizeStoredAnswer(value: Prisma.JsonValue): { choice: string } {
    if (typeof value === 'string') {
      return { choice: value.trim() };
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const candidate = (value as Record<string, unknown>).choice;
      if (typeof candidate === 'string') {
        return { choice: candidate.trim() };
      }
    }

    return { choice: '' };
  }

  private mergeAnswerRecord(
    existing: Prisma.JsonValue | null,
    answers: NormalizedAnswer[],
  ): Prisma.JsonObject {
    const base: Record<string, unknown> =
      existing && typeof existing === 'object' && !Array.isArray(existing)
        ? { ...(existing as Record<string, unknown>) }
        : {};

    for (const answer of answers) {
      base[answer.questionId] = { ...answer.value };
    }

    return base as Prisma.JsonObject;
  }

  private async persistAnswers(
    session: { id: string; answerRecord: Prisma.JsonValue | null },
    answers: NormalizedAnswer[],
  ) {
    if (!answers.length) {
      return;
    }

    const updatedRecord = this.mergeAnswerRecord(
      session.answerRecord ?? null,
      answers,
    );

    await this.prisma.$transaction([
      ...answers.map((answer) =>
        this.prisma.quizAnswer.upsert({
          where: {
            sessionId_questionId: {
              sessionId: session.id,
              questionId: answer.questionId,
            },
          },
          create: {
            sessionId: session.id,
            questionId: answer.questionId,
            value: answer.value as unknown as Prisma.InputJsonValue,
          },
          update: {
            value: answer.value as unknown as Prisma.InputJsonValue,
          },
        }),
      ),
      this.prisma.quizSession.update({
        where: { id: session.id },
        data: { answerRecord: updatedRecord },
      }),
    ]);
  }

  private async loadIngredientWhitelist(barId: string): Promise<string[]> {
    const whitelist = await this.prisma.barIngredientWhitelist.findMany({
      where: {
        barId,
        ingredient: {
          active: true,
        },
      },
      select: {
        ingredient: {
          select: {
            name: true,
          },
        },
      },
    });

    if (whitelist.length) {
      return whitelist.map((entry) => entry.ingredient.name);
    }

    const globalActive = await this.prisma.ingredient.findMany({
      where: { active: true },
      select: { name: true },
    });

    return globalActive.map((ingredient) => ingredient.name);
  }

  private async requestRecipe(
    barId: string,
    sessionId: string,
    answers: NormalizedAnswer[],
    ingredientWhitelist: string[], // kept in the signature even though we don't send it
    requestId?: string,
  ): Promise<RecipeEngineResponse> {
    return Sentry.startSpan(
      { name: 'recipe.generate', op: 'http.client' },
      async () => {
        const recipeUrl =
          this.configService.get<string>('recipeService.url') ??
          this.configService.get<string>('RECIPE_URL') ??
          process.env.RECIPE_URL ??
          'http://localhost:5000';

        const recipeSecret =
          this.configService.get<string>('recipeService.secret') ??
          this.configService.get<string>('RECIPE_JWT_SECRET') ??
          process.env.RECIPE_JWT_SECRET;

        if (!recipeSecret) {
          throw new InternalServerErrorException(
            'Recipe secret is not configured',
          );
        }

        const audience =
          this.configService.get<string>('recipeService.audience') ??
          this.configService.get<string>('RECIPE_JWT_AUD') ??
          process.env.RECIPE_JWT_AUD ??
          'recipe-engine';

        const issuer =
          this.configService.get<string>('recipeService.issuer') ??
          this.configService.get<string>('RECIPE_JWT_ISS') ??
          process.env.RECIPE_JWT_ISS ??
          'custom-cocktails-api';

        const seedBuffer = createHash('sha256').update(sessionId).digest();
        const seed = seedBuffer.readUInt32BE(0);

        const token = signJwtHS256(
          {
            sub: sessionId,
            aud: audience,
            iss: issuer,
            iat: Math.floor(Date.now() / 1000),
            exp: Math.floor(Date.now() / 1000) + 300,
          },
          recipeSecret,
        );

        // Helper for reading answers
        const choice = (id: string): string | undefined =>
          this.getAnswerChoice(answers, id);

        // Build the payload the recipe builder expects
        const recipeRequestBody = {
          bar: barId, // IMPORTANT: field name must be `bar`

          base_spirit: choice('base_spirit'),
          season: choice('season'),
          house_type: choice('house_type'),
          dining_style: choice('dining_style'),
          music_preference: choice('music_preference'),
          aroma_preference: choice('aroma_preference'),
          bitterness_tolerance: choice('bitterness_tolerance'),
          sweetener_question: choice('sweetener_question'),

          carbonation_texture: randomChoice([
            'still & silky',
            'lightly fizzy',
            'properly sparkling',
          ]),
          foam_toggle: randomChoice(['yes', 'no']),
          abv_lane: choice('abv_lane'),
          allergens: '',

          seed,
        };

        const headers: Record<string, string> = {
          Authorization: `Bearer ${token}`,
        };

        if (requestId) {
          headers['x-request-id'] = requestId;
        }

        try {
          const response = await lastValueFrom(
            this.httpService.post<RecipeEngineResponse>(
              `${recipeUrl.replace(/\/$/, '')}/generate`,
              recipeRequestBody,
              { headers },
            ),
          );

          return response.data;
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          this.logger.error(
            `Recipe engine request failed: ${errorMessage}`,
            error instanceof Error ? error.stack : undefined,
          );
          throw error;
        }
      },
    );
  }
}
