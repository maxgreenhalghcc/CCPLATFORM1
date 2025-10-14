import { HttpService } from '@nestjs/axios';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, QuizSessionStatus } from '@prisma/client';
import { lastValueFrom } from 'rxjs';
import { createHash } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { QuizAnswerDto, SubmitQuizDto } from './dto/submit-quiz.dto';
import { signJwtHS256 } from '../common/jwt';

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

@Injectable()
export class QuizService {
  private readonly logger = new Logger(QuizService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService
  ) {}

  async createSession(dto: CreateSessionDto) {
    const bar = await this.prisma.bar.findFirst({
      where: {
        slug: dto.bar_slug,
        active: true
      },
      select: {
        id: true
      }
    });

    if (!bar) {
      throw new NotFoundException('Bar not found');
    }

    const session = await this.prisma.quizSession.create({
      data: {
        barId: bar.id
      }
    });

    return {
      session_id: session.id,
      bar_id: bar.id
    };
  }

  async submit(dto: SubmitQuizDto) {
    const session = await this.prisma.quizSession.findUnique({
      where: { id: dto.session_id },
      include: {
        bar: {
          include: {
            settings: true
          }
        }
      }
    });

    if (!session) {
      throw new NotFoundException('Quiz session not found');
    }

    const existingOrder = await this.prisma.order.findFirst({
      where: { sessionId: session.id },
      select: { id: true }
    });

    if (existingOrder) {
      return { order_id: existingOrder.id };
    }

    const answers = dto.answers ?? [];

    await this.replaceAnswers(session.id, answers);

    const priceCents = session.bar.settings?.pricingCents ?? 1000;

    const order = await this.prisma.order.create({
      data: {
        barId: session.barId,
        sessionId: session.id,
        priceCents
      }
    });

    try {
      const ingredientWhitelist = await this.loadIngredientWhitelist(session.barId);
      const recipeResponse = await this.requestRecipe(
        session.barId,
        session.id,
        answers,
        ingredientWhitelist
      );

      const recipe = await this.prisma.recipe.create({
        data: {
          barId: session.barId,
          sessionId: session.id,
          name: recipeResponse.name,
          description: recipeResponse.description,
          body: {
            ingredients: recipeResponse.ingredients ?? [],
            method: recipeResponse.method ?? '',
            glassware: recipeResponse.glassware ?? '',
            garnish: recipeResponse.garnish ?? '',
            warnings: recipeResponse.warnings ?? []
          } as Prisma.JsonObject,
          abvEstimate: recipeResponse.abv_estimate ?? null
        }
      });

      await this.prisma.order.update({
        where: { id: order.id },
        data: { recipeId: recipe.id }
      });

      await this.prisma.quizSession.update({
        where: { id: session.id },
        data: { status: QuizSessionStatus.submitted }
      });

      return { order_id: order.id };
    } catch (error) {
      await this.prisma.order
        .delete({ where: { id: order.id } })
        .catch((deleteError) => {
          const rollbackMessage =
            deleteError instanceof Error ? deleteError.message : String(deleteError);
          this.logger.error(
            `Failed to rollback order ${order.id}: ${rollbackMessage}`,
            deleteError instanceof Error ? deleteError.stack : undefined
          );
        });
      await this.prisma.quizSession.update({
        where: { id: session.id },
        data: { status: QuizSessionStatus.in_progress }
      });

      if (error instanceof NotFoundException) {
        throw error;
      }

      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Recipe generation failed: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined
      );
      throw new InternalServerErrorException('Failed to generate recipe');
    }
  }

  private async replaceAnswers(sessionId: string, answers: QuizAnswerDto[]) {
    await this.prisma.quizAnswer.deleteMany({ where: { sessionId } });

    if (!answers.length) {
      return;
    }

    const normalizedAnswers = answers.map((answer) => ({
      question_id: answer.question_id,
      value: { ...answer.value }
    }));

    await this.prisma.quizAnswer.createMany({
      data: normalizedAnswers.map((answer) => ({
        sessionId,
        questionId: answer.question_id,
        value: answer.value as unknown as Prisma.JsonValue
      }))
    });
  }

  private async loadIngredientWhitelist(barId: string): Promise<string[]> {
    const whitelist = await this.prisma.barIngredientWhitelist.findMany({
      where: {
        barId,
        ingredient: {
          active: true
        }
      },
      select: {
        ingredient: {
          select: {
            name: true
          }
        }
      }
    });

    if (whitelist.length) {
      return whitelist.map((entry) => entry.ingredient.name);
    }

    const globalActive = await this.prisma.ingredient.findMany({
      where: { active: true },
      select: { name: true }
    });

    return globalActive.map((ingredient) => ingredient.name);
  }

  private async requestRecipe(
    barId: string,
    sessionId: string,
    answers: QuizAnswerDto[],
    ingredientWhitelist: string[]
  ): Promise<RecipeEngineResponse> {
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
      throw new InternalServerErrorException('Recipe secret is not configured');
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
      { sub: sessionId },
      recipeSecret,
      {
        audience,
        issuer,
        expiresInSeconds: 300
      }
    );

    const payloadAnswers = answers.map((answer) => ({
      question_id: answer.question_id,
      value: { ...answer.value }
    }));

    try {
      const response = await lastValueFrom(
        this.httpService.post<RecipeEngineResponse>(
          `${recipeUrl.replace(/\/$/, '')}/generate`,
          {
            bar_id: barId,
            session_id: sessionId,
            answers: payloadAnswers,
            ingredient_whitelist: ingredientWhitelist,
            seed
          },
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
      );

      return response.data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Recipe engine request failed: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined
      );
      throw new InternalServerErrorException('Recipe engine request failed');
    }
  }
}
