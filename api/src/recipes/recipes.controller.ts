import { Body, Controller, Post } from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { GenerateRecipeDto } from './dto/generate-recipe.dto';

@Controller('recipes:generate')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  generate(@Body() dto: GenerateRecipeDto) {
    return this.recipesService.generate(dto);
  }
}
