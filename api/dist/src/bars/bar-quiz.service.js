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
var BarQuizService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BarQuizService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const orders_service_1 = require("../orders/orders.service");
const recipes_client_1 = require("../recipes/recipes.client");
const DEFAULT_THEME = {
    primary: '#2f27ce',
    background: '#050315',
    foreground: '#fbfbfe',
    card: '#121129',
};
const DEFAULT_PALETTE = {
    primary: '#2f27ce',
    secondary: '#050315',
    accent: '#dedcff',
};
let BarQuizService = BarQuizService_1 = class BarQuizService {
    constructor(prisma, configService, ordersService, recipesClient) {
        this.prisma = prisma;
        this.configService = configService;
        this.ordersService = ordersService;
        this.recipesClient = recipesClient;
        this.logger = new common_1.Logger(BarQuizService_1.name);
    }
    async getSkin(slug) {
        if (!this.isQuizEnabled()) {
            throw new common_1.NotFoundException('Quiz is not enabled');
        }
        const bar = await this.prisma.bar.findFirst({
            where: { slug, active: true },
            include: { settings: true },
        });
        if (!bar || !bar.settings) {
            throw new common_1.NotFoundException('Bar not found');
        }
        const theme = {
            ...DEFAULT_THEME,
            ...bar.settings.theme,
        };
        const paletteRecord = this.normalizeRecord(bar.settings.brandPalette ?? null);
        const primary = paletteRecord.primary ?? paletteRecord.dominant ?? paletteRecord.main ?? theme.primary;
        const secondary = paletteRecord.secondary ?? paletteRecord.background ?? paletteRecord.support ?? theme.background;
        const accent = paletteRecord.accent ?? paletteRecord.highlight ?? theme.card;
        const palette = {
            primary,
            secondary,
            accent,
            background: theme.background,
            foreground: theme.foreground,
        };
        return {
            palette,
            logoUrl: bar.settings.logoUrl ?? null,
            title: bar.name,
            introCopy: bar.settings.introText ?? null,
        };
    }
    async submit(slug, dto, requestId) {
        if (!this.isQuizEnabled()) {
            throw new common_1.NotFoundException('Quiz is not enabled');
        }
        const bar = await this.prisma.bar.findFirst({
            where: { slug, active: true },
            include: { settings: true },
        });
        if (!bar || !bar.settings) {
            throw new common_1.NotFoundException('Bar not found');
        }
        const session = await this.prisma.quizSession.create({
            data: {
                barId: bar.id,
                status: client_1.QuizSessionStatus.submitted,
                answerRecord: {
                    answers: dto.answers,
                    customer: dto.customer,
                    notes: dto.notes ?? '',
                },
            },
        });
        let recipe;
        try {
            const answerMap = {};
            Object.entries(dto.answers).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    answerMap[key] = String(value);
                }
            });
            recipe = await this.recipesClient.buildRecipe(bar.id, answerMap, requestId);
        }
        catch (error) {
            this.logger.error('Recipe generation failed', error instanceof Error ? error.message : String(error));
            throw new common_1.ServiceUnavailableException('Unable to generate recipe');
        }
        const recipeBody = {
            ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
            method: recipe.method ?? '',
            glassware: recipe.glassware ?? '',
            garnish: recipe.garnish ?? '',
            warnings: [],
            notes: recipe.notes ?? '',
        };
        const storedRecipe = await this.prisma.recipe.create({
            data: {
                barId: bar.id,
                sessionId: session.id,
                name: recipe.cocktailName ?? 'Custom cocktail',
                description: recipe.notes ?? '',
                body: recipeBody,
                result: recipe,
            },
        });
        const price = bar.settings.pricingPounds ?? new client_1.Prisma.Decimal(0);
        const items = this.buildOrderItems(recipe);
        const order = await this.ordersService.createFromRecipe({
            barId: bar.id,
            sessionId: session.id,
            recipeId: storedRecipe.id,
            amount: price,
            currency: 'gbp',
            items,
            recipeJson: recipe,
        });
        const paymentsEnabled = this.configService.get('features.enablePayment') ?? true;
        if (!paymentsEnabled) {
            return {
                orderId: order.id,
                checkoutUrl: `/receipt?orderId=${order.id}`,
                barSlug: bar.slug,
            };
        }
        const checkout = await this.ordersService.createCheckout(order.id);
        return {
            orderId: order.id,
            checkoutUrl: checkout.checkout_url,
            barSlug: bar.slug,
        };
    }
    buildOrderItems(recipe) {
        const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
        if (ingredients.length === 0) {
            return [
                {
                    sku: 'CUSTOM-COCKTAIL',
                    qty: 1,
                },
            ];
        }
        return ingredients.map((ingredient) => ({
            sku: this.normalizeSku(ingredient.sku ?? ingredient.name ?? 'INGREDIENT'),
            qty: this.normalizeQuantity(ingredient.qtyMl),
        }));
    }
    normalizeQuantity(qtyMl) {
        if (typeof qtyMl !== 'number' || Number.isNaN(qtyMl)) {
            return 1;
        }
        const units = Math.max(1, Math.round(qtyMl / 25));
        return units;
    }
    normalizeSku(value) {
        return value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '-').slice(0, 64) || 'INGREDIENT';
    }
    normalizeRecord(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return { ...DEFAULT_PALETTE };
        }
        const entries = Object.entries(value).reduce((acc, [key, current]) => {
            if (typeof current !== 'string') {
                return acc;
            }
            const trimmed = current.trim();
            if (trimmed.length === 0) {
                return acc;
            }
            acc[key] = trimmed;
            return acc;
        }, { ...DEFAULT_PALETTE });
        return entries;
    }
    isQuizEnabled() {
        return this.configService.get('quiz.enabled') ?? false;
    }
};
exports.BarQuizService = BarQuizService;
exports.BarQuizService = BarQuizService = BarQuizService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        orders_service_1.OrdersService,
        recipes_client_1.RecipesClient])
], BarQuizService);
//# sourceMappingURL=bar-quiz.service.js.map