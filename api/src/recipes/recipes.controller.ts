import { Body, Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { RecipesService } from './recipes.service';
import { GenerateRecipeDto } from './dto/generate-recipe.dto';

@Controller('recipes:generate')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  generate(@Body() dto: GenerateRecipeDto, @Req() req: Request) {
    const requestId = (req as any)?.requestId as string | undefined;
    return this.recipesService.generate(dto, requestId);
  }
}
