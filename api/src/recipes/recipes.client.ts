import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface RecipeBuildIngredient {
  sku?: string;
  name?: string;
  qtyMl?: number;
}

export interface RecipeBuildResult {
  cocktailName?: string;
  glassware?: string;
  method?: string;
  garnish?: string;
  ingredients?: RecipeBuildIngredient[];
  notes?: string;
}

@Injectable()
export class RecipesClient {
  private readonly logger = new Logger(RecipesClient.name);
  private readonly baseUrl: string;
  private readonly mockEnabled: boolean;

  constructor(private readonly http: HttpService, private readonly configService: ConfigService) {
    const rawBase = this.configService.get<string>('quiz.recipeApiBase') ?? '';
    this.baseUrl = rawBase.replace(/\/$/, '');
    this.mockEnabled = this.configService.get<boolean>('quiz.mockRecipes') ?? false;
  }

  async buildRecipe(barId: string, answers: Record<string, string>, requestId?: string): Promise<RecipeBuildResult> {
    if (!this.baseUrl || this.mockEnabled) {
      return this.createMockRecipe(barId, answers);
    }

    try {
      const payload = { barId, answers };
      const headers = requestId ? { 'x-request-id': requestId } : undefined;

      // Prefer /generate (current recipe service), fall back to /build (legacy).
      try {
        const response$ = this.http.post<RecipeBuildResult>(
          `${this.baseUrl}/generate`,
          payload,
          { headers },
        );
        const response = await firstValueFrom(response$);
        return response.data ?? {};
      } catch (error) {
        // If /generate isn't supported, try legacy /build.
        const response$ = this.http.post<RecipeBuildResult>(
          `${this.baseUrl}/build`,
          payload,
          { headers },
        );
        const response = await firstValueFrom(response$);
        return response.data ?? {};
      }
    } catch (error) {
      if (this.mockEnabled) {
        this.logger.warn('Recipe API unavailable, falling back to mock recipe');
        return this.createMockRecipe(barId, answers);
      }

      this.logger.error('Recipe API request failed', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  private createMockRecipe(barId: string, answers: Record<string, string>): RecipeBuildResult {
    const seed = this.createSeed(barId, answers);
    const baseSpirits = ['Vodka', 'Gin', 'Rum', 'Tequila', 'Whiskey'];
    const modifiers = ['Citrus cordial', 'Aromatic bitters', 'Vermouth', 'Elderflower liqueur'];
    const garnishes = ['Lemon twist', 'Grapefruit peel', 'Dehydrated lime', 'Mint sprig'];
    const spirit = baseSpirits[seed % baseSpirits.length];
    const modifier = modifiers[seed % modifiers.length];
    const garnish = garnishes[seed % garnishes.length];

    return {
      cocktailName: `${answers.season ?? 'Signature'} ${spirit}`.trim(),
      glassware: 'Coupe',
      method: 'Shake with ice and fine strain into a chilled glass.',
      garnish,
      ingredients: [
        { sku: `${spirit.toUpperCase().replace(/\s+/g, '-')}-BASE`, name: spirit, qtyMl: 50 },
        { sku: modifier.toUpperCase().replace(/\s+/g, '-') + '-MOD', name: modifier, qtyMl: 20 },
        { sku: 'CITRUS-MIX', name: 'Fresh citrus blend', qtyMl: 15 },
      ],
      notes: 'Mock recipe generated locally.',
    };
  }

  private createSeed(barId: string, answers: Record<string, string>): number {
    const source = `${barId}|${Object.values(answers).join('|')}`;
    let hash = 0;
    for (let i = 0; i < source.length; i += 1) {
      hash = (hash << 5) - hash + source.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash);
  }
}
