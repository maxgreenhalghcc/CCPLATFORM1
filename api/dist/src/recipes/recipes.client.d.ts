import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
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
export declare class RecipesClient {
    private readonly http;
    private readonly configService;
    private readonly logger;
    private readonly baseUrl;
    private readonly mockEnabled;
    constructor(http: HttpService, configService: ConfigService);
    buildRecipe(barId: string, answers: Record<string, string>, requestId?: string): Promise<RecipeBuildResult>;
    private createMockRecipe;
    private createSeed;
}
