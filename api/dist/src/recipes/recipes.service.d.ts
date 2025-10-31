import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { GenerateRecipeDto } from './dto/generate-recipe.dto';
export declare class RecipesService {
    private readonly http;
    private readonly configService;
    private readonly logger;
    constructor(http: HttpService, configService: ConfigService);
    generate(dto: GenerateRecipeDto, requestId?: string): Promise<any>;
}
