"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RecipesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipesService = void 0;
const axios_1 = require("@nestjs/axios");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
let RecipesService = RecipesService_1 = class RecipesService {
    constructor(http, configService) {
        this.http = http;
        this.configService = configService;
        this.logger = new common_1.Logger(RecipesService_1.name);
        this.recipeApiUrl =
            this.configService.get('RECIPE_SERVICE_URL') ??
                this.configService.get('RECIPE_API_URL') ??
                '';
    }
    async generate(dto, requestId) {
        const url = this.recipeApiUrl ||
            this.configService.get('recipeService.url') ||
            'http://localhost:8000';
        const payload = {
            bar_id: dto.barId,
            session_id: dto.sessionId,
            seed: dto.seed ?? Date.now(),
            quiz: dto.quiz ?? {},
        };
        const headers = {};
        if (requestId) {
            headers['x-request-id'] = requestId;
        }
        const response$ = this.http
            .post(`${url}/generate`, payload, { headers })
            .pipe((0, operators_1.map)((response) => {
            const data = response.data;
            if (data && typeof data === 'object' && 'recipe' in data) {
                const { id, recipe } = data;
                return {
                    id: id ?? `recipe_${dto.sessionId}`,
                    ...(recipe ?? {}),
                };
            }
            return data;
        }), (0, operators_1.catchError)((error) => {
            this.logger.error('Recipe generation failed', error?.message ?? error);
            return (0, rxjs_1.of)({
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
        }));
        return (0, rxjs_1.firstValueFrom)(response$);
    }
};
exports.RecipesService = RecipesService;
exports.RecipesService = RecipesService = RecipesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], RecipesService);
//# sourceMappingURL=recipes.service.js.map