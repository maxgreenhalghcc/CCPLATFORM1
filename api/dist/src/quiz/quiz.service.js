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
var QuizService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuizService = void 0;
const axios_1 = require("@nestjs/axios");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const rxjs_1 = require("rxjs");
const crypto_1 = require("crypto");
const Sentry = require("@sentry/node");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_1 = require("../common/jwt");
function randomChoice(options) {
    return options[Math.floor(Math.random() * options.length)];
}
let QuizService = QuizService_1 = class QuizService {
    constructor(prisma, httpService, configService) {
        this.prisma = prisma;
        this.httpService = httpService;
        this.configService = configService;
        this.logger = new common_1.Logger(QuizService_1.name);
    }
    getAnswerChoice(answers, id) {
        const found = answers.find((a) => a.questionId === id);
        return found?.value.choice;
    }
    async createSession(slug, dto) {
        void dto;
        const bar = await this.prisma.bar.findFirst({
            where: {
                slug,
                active: true,
            },
            include: {
                settings: {
                    select: {
                        quizPaused: true,
                    },
                },
            },
        });
        if (!bar) {
            throw new common_1.NotFoundException('Bar not found');
        }
        if (bar.settings?.quizPaused) {
            throw new common_1.NotFoundException('Quiz is paused');
        }
        const session = await this.prisma.quizSession.create({
            data: {
                barId: bar.id,
            },
        });
        return {
            sessionId: session.id,
        };
    }
    async recordAnswer(sessionId, dto) {
        const session = await this.prisma.quizSession.findUnique({
            where: { id: sessionId },
            select: { id: true, answerRecord: true },
        });
        if (!session) {
            throw new common_1.NotFoundException('Quiz session not found');
        }
        const answer = {
            questionId: dto.questionId,
            value: this.normalizeAnswerValue(dto.value?.choice),
        };
        await this.persistAnswers(session, [answer]);
        return { status: 'recorded' };
    }
    async submit(sessionId, dto, requestId) {
        return Sentry.startSpan({ name: 'quiz.submit', op: 'service' }, async () => {
            const session = await this.prisma.quizSession.findUnique({
                where: { id: sessionId },
                include: {
                    bar: {
                        include: {
                            settings: true,
                        },
                    },
                },
            });
            if (!session) {
                throw new common_1.NotFoundException('Quiz session not found');
            }
            if (session.bar.settings?.quizPaused) {
                throw new common_1.NotFoundException('Quiz is paused');
            }
            if (dto.answers?.length) {
                const normalized = dto.answers.map((answer) => ({
                    questionId: answer.questionId,
                    value: this.normalizeAnswerValue(answer.value.choice),
                }));
                await this.persistAnswers({ id: session.id, answerRecord: session.answerRecord ?? null }, normalized);
            }
            const existingOrder = await this.prisma.order.findFirst({
                where: { sessionId: session.id },
                select: { id: true },
            });
            if (existingOrder) {
                return { orderId: existingOrder.id };
            }
            const storedAnswers = await this.prisma.quizAnswer.findMany({
                where: { sessionId: session.id },
            });
            const normalizedAnswers = storedAnswers.map((entry) => ({
                questionId: entry.questionId,
                value: this.normalizeStoredAnswer(entry.value),
            }));
            const defaultPrice = new client_1.Prisma.Decimal(12);
            const amount = session.bar.settings?.pricingPounds ?? defaultPrice;
            const order = await this.prisma.order.create({
                data: {
                    barId: session.barId,
                    sessionId: session.id,
                    amount,
                    currency: 'gbp',
                    status: client_1.OrderStatus.created,
                },
            });
            try {
                const ingredientWhitelist = await this.loadIngredientWhitelist(session.barId);
                const recipeResponse = await this.requestRecipe(session.bar.slug, session.id, normalizedAnswers, ingredientWhitelist, requestId);
                const cocktailName = dto.contact?.trim() || recipeResponse.name || 'Custom Cocktail';
                const recipe = await this.prisma.recipe.create({
                    data: {
                        barId: session.barId,
                        sessionId: session.id,
                        name: cocktailName,
                        description: recipeResponse.description ??
                            'A bespoke cocktail created from your quiz answers.',
                        body: {
                            ingredients: recipeResponse.ingredients ?? [],
                            method: recipeResponse.method ?? '',
                            glassware: recipeResponse.glassware ?? '',
                            garnish: recipeResponse.garnish ?? '',
                            warnings: recipeResponse.warnings ?? [],
                        },
                        abvEstimate: recipeResponse.abv_estimate ?? null,
                    },
                });
                await this.prisma.order.update({
                    where: { id: order.id },
                    data: { recipeId: recipe.id },
                });
                await this.prisma.quizSession.update({
                    where: { id: session.id },
                    data: { status: client_1.QuizSessionStatus.submitted },
                });
                return { orderId: order.id };
            }
            catch (error) {
                await this.prisma.order
                    .delete({ where: { id: order.id } })
                    .catch((deleteError) => {
                    const rollbackMessage = deleteError instanceof Error
                        ? deleteError.message
                        : String(deleteError);
                    this.logger.error(`Failed to rollback order ${order.id}: ${rollbackMessage}`, deleteError instanceof Error ? deleteError.stack : undefined);
                });
                await this.prisma.quizSession.update({
                    where: { id: session.id },
                    data: { status: client_1.QuizSessionStatus.in_progress },
                });
                if (error instanceof common_1.NotFoundException) {
                    throw error;
                }
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger.error(`Recipe generation failed: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
                throw new common_1.InternalServerErrorException('Failed to generate recipe');
            }
        });
    }
    normalizeAnswerValue(choice) {
        if (typeof choice === 'string') {
            return { choice: choice.trim() };
        }
        return { choice: '' };
    }
    normalizeStoredAnswer(value) {
        if (typeof value === 'string') {
            return { choice: value.trim() };
        }
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            const candidate = value.choice;
            if (typeof candidate === 'string') {
                return { choice: candidate.trim() };
            }
        }
        return { choice: '' };
    }
    mergeAnswerRecord(existing, answers) {
        const base = existing && typeof existing === 'object' && !Array.isArray(existing)
            ? { ...existing }
            : {};
        for (const answer of answers) {
            base[answer.questionId] = { ...answer.value };
        }
        return base;
    }
    async persistAnswers(session, answers) {
        if (!answers.length) {
            return;
        }
        const updatedRecord = this.mergeAnswerRecord(session.answerRecord ?? null, answers);
        await this.prisma.$transaction([
            ...answers.map((answer) => this.prisma.quizAnswer.upsert({
                where: {
                    sessionId_questionId: {
                        sessionId: session.id,
                        questionId: answer.questionId,
                    },
                },
                create: {
                    sessionId: session.id,
                    questionId: answer.questionId,
                    value: answer.value,
                },
                update: {
                    value: answer.value,
                },
            })),
            this.prisma.quizSession.update({
                where: { id: session.id },
                data: { answerRecord: updatedRecord },
            }),
        ]);
    }
    async loadIngredientWhitelist(barId) {
        const whitelist = await this.prisma.barIngredientWhitelist.findMany({
            where: {
                barId,
                ingredient: {
                    active: true,
                },
            },
            select: {
                ingredient: {
                    select: {
                        name: true,
                    },
                },
            },
        });
        if (whitelist.length) {
            return whitelist.map((entry) => entry.ingredient.name);
        }
        const globalActive = await this.prisma.ingredient.findMany({
            where: { active: true },
            select: { name: true },
        });
        return globalActive.map((ingredient) => ingredient.name);
    }
    async requestRecipe(barId, sessionId, answers, ingredientWhitelist, requestId) {
        return Sentry.startSpan({ name: 'recipe.generate', op: 'http.client' }, async () => {
            const recipeUrl = this.configService.get('recipeService.url') ??
                this.configService.get('RECIPE_URL') ??
                process.env.RECIPE_URL ??
                'http://localhost:5000';
            const recipeSecret = this.configService.get('recipeService.secret') ??
                this.configService.get('RECIPE_JWT_SECRET') ??
                process.env.RECIPE_JWT_SECRET;
            if (!recipeSecret) {
                throw new common_1.InternalServerErrorException('Recipe secret is not configured');
            }
            const audience = this.configService.get('recipeService.audience') ??
                this.configService.get('RECIPE_JWT_AUD') ??
                process.env.RECIPE_JWT_AUD ??
                'recipe-engine';
            const issuer = this.configService.get('recipeService.issuer') ??
                this.configService.get('RECIPE_JWT_ISS') ??
                process.env.RECIPE_JWT_ISS ??
                'custom-cocktails-api';
            const seedBuffer = (0, crypto_1.createHash)('sha256').update(sessionId).digest();
            const seed = seedBuffer.readUInt32BE(0);
            const token = (0, jwt_1.signJwtHS256)({
                sub: sessionId,
                aud: audience,
                iss: issuer,
                iat: Math.floor(Date.now() / 1000),
                exp: Math.floor(Date.now() / 1000) + 300,
            }, recipeSecret);
            const choice = (id) => this.getAnswerChoice(answers, id);
            const recipeRequestBody = {
                bar: barId,
                base_spirit: choice('base_spirit'),
                season: choice('season'),
                house_type: choice('house_type'),
                dining_style: choice('dining_style'),
                music_preference: choice('music_preference'),
                aroma_preference: choice('aroma_preference'),
                bitterness_tolerance: choice('bitterness_tolerance'),
                sweetener_question: choice('sweetener_question'),
                carbonation_texture: randomChoice([
                    'still & silky',
                    'lightly fizzy',
                    'properly sparkling',
                ]),
                foam_toggle: randomChoice(['yes', 'no']),
                abv_lane: choice('abv_lane'),
                allergens: '',
                seed,
            };
            const headers = {
                Authorization: `Bearer ${token}`,
            };
            if (requestId) {
                headers['x-request-id'] = requestId;
            }
            try {
                const response = await (0, rxjs_1.lastValueFrom)(this.httpService.post(`${recipeUrl.replace(/\/$/, '')}/generate`, recipeRequestBody, { headers }));
                return response.data;
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                this.logger.error(`Recipe engine request failed: ${errorMessage}`, error instanceof Error ? error.stack : undefined);
                throw error;
            }
        });
    }
};
exports.QuizService = QuizService;
exports.QuizService = QuizService = QuizService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        axios_1.HttpService,
        config_1.ConfigService])
], QuizService);
//# sourceMappingURL=quiz.service.js.map