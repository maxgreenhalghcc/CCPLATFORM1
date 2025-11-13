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
var RecipesClient_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RecipesClient = void 0;
const axios_1 = require("@nestjs/axios");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
let RecipesClient = RecipesClient_1 = class RecipesClient {
    constructor(http, configService) {
        this.http = http;
        this.configService = configService;
        this.logger = new common_1.Logger(RecipesClient_1.name);
        const rawBase = this.configService.get('quiz.recipeApiBase') ?? '';
        this.baseUrl = rawBase.replace(/\/$/, '');
        this.mockEnabled = this.configService.get('quiz.mockRecipes') ?? false;
    }
    async buildRecipe(barId, answers, requestId) {
        if (!this.baseUrl || this.mockEnabled) {
            return this.createMockRecipe(barId, answers);
        }
        try {
            const response$ = this.http.post(`${this.baseUrl}/build`, {
                barId,
                answers,
            }, {
                headers: requestId ? { 'x-request-id': requestId } : undefined,
            });
            const response = await (0, rxjs_1.firstValueFrom)(response$);
            return response.data ?? {};
        }
        catch (error) {
            if (this.mockEnabled) {
                this.logger.warn('Recipe API unavailable, falling back to mock recipe');
                return this.createMockRecipe(barId, answers);
            }
            this.logger.error('Recipe API request failed', error instanceof Error ? error.message : String(error));
            throw error;
        }
    }
    createMockRecipe(barId, answers) {
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
    createSeed(barId, answers) {
        const source = `${barId}|${Object.values(answers).join('|')}`;
        let hash = 0;
        for (let i = 0; i < source.length; i += 1) {
            hash = (hash << 5) - hash + source.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }
};
exports.RecipesClient = RecipesClient;
exports.RecipesClient = RecipesClient = RecipesClient_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService, config_1.ConfigService])
], RecipesClient);
//# sourceMappingURL=recipes.client.js.map