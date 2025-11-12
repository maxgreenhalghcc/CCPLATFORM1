import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { GenerateRecipeDto } from './dto/generate-recipe.dto';

@Injectable()
export class RecipesService {
  private readonly logger = new Logger(RecipesService.name);
  private readonly recipeApiUrl: string;

  constructor(
    private readonly http: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.recipeApiUrl = this.configService.get<string>('RECIPE_API_URL') ?? '';
  }

  async generate(dto: GenerateRecipeDto, requestId?: string) {
    const url =
      this.recipeApiUrl ||
      this.configService.get<string>('recipeService.url') ||
      'http://localhost:5000';

    const payload = {
      bar_id: dto.barId,
      session_id: dto.sessionId,
      seed: dto.seed ?? Date.now(),
      quiz: dto.quiz ?? {},
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
            { name: 'Aromatic bitters', amount: '2 dashes' },
          ],
        });
      }),
    );

    return firstValueFrom(response$);
  }
}
