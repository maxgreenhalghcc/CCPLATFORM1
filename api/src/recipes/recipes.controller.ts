import { Body, Controller, Post, Req } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { GenerateRecipeDto } from './dto/generate-recipe.dto';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post('generate')
  async generate(@Body() dto: GenerateRecipeDto, @Req() req: any) {
    const requestId =
      (req.headers['x-request-id'] as string | undefined) ??
      (req.headers['x-requestid'] as string | undefined);

    return this.recipesService.generate(dto, requestId);
  }
}
