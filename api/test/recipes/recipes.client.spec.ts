import { of } from 'rxjs';
import type { ConfigService } from '@nestjs/config';
import type { HttpService } from '@nestjs/axios';
import { RecipesClient } from '../../src/recipes/recipes.client';

describe('RecipesClient', () => {
  it('returns a mock recipe when mock mode is enabled', async () => {
    const http = { post: jest.fn() } as unknown as HttpService;
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'quiz.recipeApiBase') {
          return '';
        }
        if (key === 'quiz.mockRecipes') {
          return true;
        }
        return undefined;
      }),
    } as unknown as ConfigService;

    const client = new RecipesClient(http, config);
    const recipe = await client.buildRecipe('bar_1', { season: 'summer' });

    expect(recipe.cocktailName).toContain('summer');
    expect(config.get).toHaveBeenCalled();
    expect(http.post).not.toHaveBeenCalled();
  });

  it('calls the external API when configured', async () => {
    const http = {
      post: jest.fn().mockReturnValue(of({ data: { cocktailName: 'Summer Jazz' } })),
    } as unknown as HttpService;
    const config = {
      get: jest.fn((key: string) => {
        if (key === 'quiz.recipeApiBase') {
          return 'https://api.example.com';
        }
        if (key === 'quiz.mockRecipes') {
          return false;
        }
        return undefined;
      }),
    } as unknown as ConfigService;

    const client = new RecipesClient(http, config);
    const answers = { season: 'summer' };
    const recipe = await client.buildRecipe('bar_1', answers, 'req-123');

    expect(recipe).toEqual({ cocktailName: 'Summer Jazz' });
    expect(http.post).toHaveBeenCalledWith(
      'https://api.example.com/build',
      { barId: 'bar_1', answers },
      { headers: { 'x-request-id': 'req-123' } },
    );
  });
});
