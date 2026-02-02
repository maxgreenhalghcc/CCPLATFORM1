import type { Request } from 'express';
import { RecipesService } from './recipes.service';
import { GenerateRecipeDto } from './dto/generate-recipe.dto';
export declare class RecipesController {
    private readonly recipesService;
    constructor(recipesService: RecipesService);
    generate(dto: GenerateRecipeDto, req: Request): Promise<any>;
}
