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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_1 = require("@prisma/client");
const stripe_1 = require("stripe");
const prisma_service_1 = require("../prisma/prisma.service");
const Sentry = require("@sentry/node");
const nodemailer = require("nodemailer");
let OrdersService = class OrdersService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
    }
    getStripe() {
        if (this.stripeClient) {
            return this.stripeClient;
        }
        const secretKey = process.env.STRIPE_SECRET_KEY;
        if (!secretKey) {
            throw new common_1.InternalServerErrorException('Stripe secret key is not configured');
        }
        this.stripeClient = new stripe_1.default(secretKey, {
            apiVersion: '2022-11-15'
        });
        return this.stripeClient;
    }
    createMailTransport() {
        const server = this.configService.get('EMAIL_SERVER');
        if (server && server.length > 0) {
            console.log('[orders] createMailTransport: using real EMAIL_SERVER');
            return nodemailer.createTransport(server);
        }
        console.warn('[orders] createMailTransport: EMAIL_SERVER is NOT configured – using jsonTransport (no real emails will be sent)');
        return nodemailer.createTransport({ jsonTransport: true });
    }
    getEmailFromAddress() {
        return (this.configService.get('EMAIL_FROM') ??
            'login@example.com');
    }
    async sendRecipeEmail(orderId) {
        console.log('[orders] sendRecipeEmail: starting for order', orderId);
        const recipe = await this.getRecipe(orderId);
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            select: {
                contact: true,
            },
        });
        if (!order || !order.contact) {
            console.warn('[orders] sendRecipeEmail: no contact stored for order', orderId, '(nothing to send)');
            return;
        }
        const to = order.contact;
        const from = this.getEmailFromAddress();
        const rawIngredients = Array.isArray(recipe.ingredients)
            ? recipe.ingredients
            : [];
        const ingredientLines = rawIngredients
            .map((item) => {
            if (!item)
                return '';
            if (typeof item === 'string') {
                return item;
            }
            if (typeof item === 'object') {
                const { amount, unit, ingredient, name } = item;
                const qty = [amount, unit].filter(Boolean).join(' ');
                const label = ingredient || name || '';
                const line = [qty, label].filter(Boolean).join(' ');
                return line || JSON.stringify(item);
            }
            return String(item);
        })
            .filter(Boolean);
        const ingredientsList = ingredientLines.length > 0 ? ingredientLines.join('\n') : 'Ask the bartender 😉';
        const text = [
            `Here’s your custom cocktail recipe: ${recipe.name}`,
            '',
            'Ingredients:',
            ingredientsList,
            '',
            recipe.method ? `Method:\n${recipe.method}` : '',
            '',
            recipe.glassware ? `Glassware: ${recipe.glassware}` : '',
            recipe.garnish ? `Garnish: ${recipe.garnish}` : '',
            '',
            'Enjoy!',
        ]
            .filter(Boolean)
            .join('\n');
        const html = `
  <h1>Your custom cocktail: ${recipe.name}</h1>
  <p>Here’s your custom cocktail recipe.</p>
  <h2>Ingredients</h2>
  <ul>
    ${ingredientLines.map((item) => `<li>${item}</li>`).join('')}
  </ul>
  ${recipe.method
            ? `<h2>Method</h2><p>${recipe.method.replace(/\n/g, '<br/>')}</p>`
            : ''}
  ${recipe.glassware
            ? `<p><strong>Glassware:</strong> ${recipe.glassware}</p>`
            : ''}
  ${recipe.garnish
            ? `<p><strong>Garnish:</strong> ${recipe.garnish}</p>`
            : ''}
  <p>Enjoy! 🍸</p>
  `;
        const transport = this.createMailTransport();
        try {
            console.log('[orders] sendRecipeEmail: sending to', to, 'from', from);
            await transport.sendMail({
                to,
                from,
                subject: `Your custom cocktail recipe: ${recipe.name}`,
                text,
                html,
            });
            console.log('[orders] sendRecipeEmail: recipe email sent to', to, 'for order', orderId);
        }
        catch (err) {
            console.error('[orders] sendRecipeEmail: ERROR sending recipe email', {
                orderId,
                to,
                err,
            });
        }
    }
    resolveFrontendUrl(path) {
        const baseUrl = this.configService.get('NEXT_PUBLIC_FRONTEND_URL') ??
            this.configService.get('NEXTAUTH_URL') ??
            'http://localhost:3000';
        const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        return `${normalizedBase}${path.startsWith('/') ? path : `/${path}`}`;
    }
    async createFromRecipe(params) {
        if (!Array.isArray(params.items) || params.items.length === 0) {
            throw new common_1.BadRequestException('Order requires at least one item');
        }
        return this.prisma.order.create({
            data: {
                barId: params.barId,
                sessionId: params.sessionId,
                recipeId: params.recipeId,
                amount: params.amount,
                currency: (params.currency ?? 'gbp').toLowerCase(),
                status: client_1.OrderStatus.created,
                recipeJson: params.recipeJson,
                items: {
                    create: params.items.map((item) => ({
                        sku: item.sku,
                        qty: item.qty,
                    })),
                },
            },
        });
    }
    async createCheckout(orderId, dto) {
        return Sentry.startSpan({ name: 'orders.checkout', op: 'service' }, async () => {
            const order = await this.prisma.order.findUnique({
                where: { id: orderId },
                include: {
                    bar: {
                        select: {
                            slug: true,
                            name: true
                        }
                    }
                }
            });
            if (!order) {
                throw new common_1.NotFoundException('Order not found');
            }
            const stripe = this.getStripe();
            if (order.stripeSessionId) {
                try {
                    const existing = await stripe.checkout.sessions.retrieve(order.stripeSessionId);
                    if (existing.currency && existing.currency !== order.currency) {
                        await this.prisma.order.update({
                            where: { id: order.id },
                            data: { currency: existing.currency.toLowerCase() }
                        });
                    }
                    if (existing.url && existing.status !== 'expired') {
                        return { checkout_url: existing.url };
                    }
                }
                catch (error) {
                }
            }
            const successUrl = dto?.successUrl ?? this.resolveFrontendUrl(`/checkout/success?orderId=${order.id}`);
            const cancelUrl = dto?.cancelUrl ?? this.resolveFrontendUrl(`/checkout/cancel?orderId=${order.id}`);
            const currency = (dto?.currency ?? order.currency).toLowerCase();
            const amountInMinorUnits = Math.round(order.amount.mul(100).toNumber());
            let session;
            try {
                session = await stripe.checkout.sessions.create({
                    mode: 'payment',
                    payment_method_types: ['card'],
                    metadata: {
                        orderId: String(order.id),
                        barId: String(order.barId),
                        sessionId: String(order.sessionId),
                    },
                    line_items: [
                        {
                            quantity: 1,
                            price_data: {
                                currency,
                                unit_amount: amountInMinorUnits,
                                product_data: {
                                    name: `${order.bar.name} Custom Cocktail`,
                                },
                            },
                        },
                    ],
                    success_url: successUrl,
                    cancel_url: cancelUrl,
                });
            }
            catch (error) {
                console.error('Stripe error creating checkout session', {
                    message: error?.message,
                    type: error?.type,
                    code: error?.code,
                    raw: error,
                });
                throw error;
            }
            await this.prisma.order.update({
                where: { id: order.id },
                data: {
                    stripeSessionId: session.id,
                    currency: (session.currency ?? currency).toLowerCase()
                }
            });
            if (!session.url) {
                throw new common_1.InternalServerErrorException('Stripe session did not return a URL');
            }
            return { checkout_url: session.url };
        });
    }
    async getRecipe(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: {
                recipe: true
            }
        });
        if (!order) {
            throw new common_1.NotFoundException('Order not found');
        }
        if (!order.recipe) {
            throw new common_1.NotFoundException('Recipe not found for order');
        }
        const body = order.recipe.body ?? {};
        const ingredients = Array.isArray(body.ingredients) ? body.ingredients : [];
        const method = typeof body.method === 'string' ? body.method : '';
        const glassware = typeof body.glassware === 'string' ? body.glassware : '';
        const garnish = typeof body.garnish === 'string' ? body.garnish : '';
        const warnings = Array.isArray(body.warnings) ? body.warnings : [];
        return {
            orderId: order.id,
            status: order.status,
            fulfilledAt: order.fulfilledAt ? order.fulfilledAt.toISOString() : null,
            name: order.recipe.name,
            description: order.recipe.description,
            ingredients,
            method,
            glassware,
            garnish,
            warnings
        };
    }
    async listForBar(barIdentifier, status, requester) {
        const bar = await this.prisma.bar.findFirst({
            where: {
                OR: [{ id: barIdentifier }, { slug: barIdentifier }]
            }
        });
        if (!bar) {
            throw new common_1.NotFoundException('Bar not found');
        }
        if (requester) {
            if (requester.role === client_1.UserRole.staff) {
                if (!requester.barId || requester.barId !== bar.id) {
                    throw new common_1.ForbiddenException('Staff users can only access their assigned bar');
                }
            }
            else if (requester.role !== client_1.UserRole.admin) {
                throw new common_1.ForbiddenException('User is not permitted to view orders');
            }
        }
        if (status && !Object.values(client_1.OrderStatus).includes(status)) {
            throw new common_1.BadRequestException('Invalid status filter');
        }
        const orders = await this.prisma.order.findMany({
            where: {
                barId: bar.id,
                ...(status ? { status } : {})
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
            select: {
                id: true,
                status: true,
                createdAt: true,
                fulfilledAt: true,
                recipe: {
                    select: { name: true },
                }
            }
        });
        return {
            items: orders.map((order) => ({
                id: order.id,
                status: order.status,
                createdAt: order.createdAt.toISOString(),
                fulfilledAt: order.fulfilledAt?.toISOString() ?? null,
                recipeName: order.recipe?.name ?? 'Custom cocktail',
            }))
        };
    }
    async updateStatus(orderId, status, requester) {
        if (status !== 'fulfilled') {
            throw new common_1.BadRequestException('Unsupported status transition');
        }
        return Sentry.startSpan({ name: 'orders.fulfill', op: 'service' }, async () => {
            const order = await this.prisma.order.findUnique({
                where: { id: orderId },
                select: {
                    id: true,
                    status: true,
                    fulfilledAt: true,
                    barId: true,
                },
            });
            if (!order) {
                throw new common_1.NotFoundException('Order not found');
            }
            if (requester) {
                if (requester.role === client_1.UserRole.staff) {
                    if (!requester.barId || requester.barId !== order.barId) {
                        throw new common_1.ForbiddenException('Staff users can only update orders for their bar');
                    }
                }
                else if (requester.role !== client_1.UserRole.admin) {
                    throw new common_1.ForbiddenException('User is not permitted to update orders');
                }
            }
            if (order.status === client_1.OrderStatus.fulfilled) {
                if (!order.fulfilledAt) {
                    const updated = await this.prisma.order.update({
                        where: { id: order.id },
                        data: { fulfilledAt: new Date() },
                        select: {
                            id: true,
                            status: true,
                            fulfilledAt: true,
                        },
                    });
                    await this.sendRecipeEmail(order.id);
                    return {
                        id: updated.id,
                        status: updated.status,
                        fulfilledAt: updated.fulfilledAt?.toISOString() ?? null,
                    };
                }
                return {
                    id: order.id,
                    status: order.status,
                    fulfilledAt: order.fulfilledAt?.toISOString() ?? null,
                };
            }
            if (order.status !== client_1.OrderStatus.paid) {
                throw new common_1.ConflictException('Only paid orders can be fulfilled');
            }
            const fulfilledAt = new Date();
            const updated = await this.prisma.order.update({
                where: { id: order.id },
                data: {
                    status: client_1.OrderStatus.fulfilled,
                    fulfilledAt,
                },
                select: {
                    id: true,
                    status: true,
                    fulfilledAt: true,
                },
            });
            await this.sendRecipeEmail(order.id);
            return {
                id: updated.id,
                status: updated.status,
                fulfilledAt: updated.fulfilledAt?.toISOString() ?? null,
            };
        });
    }
    async saveContact(orderId, contact) {
        await this.prisma.order.update({
            where: { id: orderId },
            data: {
                contact,
            },
        });
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map