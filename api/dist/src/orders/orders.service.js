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
const user_role_enum_1 = require("../common/roles/user-role.enum");
const stripe_1 = require("stripe");
const prisma_service_1 = require("../prisma/prisma.service");
const Sentry = require("@sentry/node");
const OrderStatusValues = {
    created: 'created',
    paid: 'paid',
    cancelled: 'cancelled',
    fulfilled: 'fulfilled',
};
let OrdersService = class OrdersService {
    constructor(prisma, configService) {
        this.prisma = prisma;
        this.configService = configService;
    }
    getStripe() {
        if (this.stripeClient) {
            return this.stripeClient;
        }
        const secretKey = this.configService.get('stripe.secretKey');
        if (!secretKey) {
            throw new common_1.InternalServerErrorException('Stripe secret key is not configured');
        }
        this.stripeClient = new stripe_1.default(secretKey, {
            apiVersion: '2022-11-15'
        });
        return this.stripeClient;
    }
    resolveFrontendUrl(path) {
        const baseUrl = this.configService.get('NEXT_PUBLIC_FRONTEND_URL') ??
            this.configService.get('NEXTAUTH_URL') ??
            'http://localhost:3000';
        const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        return `${normalizedBase}${path.startsWith('/') ? path : `/${path}`}`;
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
            const session = await stripe.checkout.sessions.create({
                mode: 'payment',
                payment_method_types: ['card'],
                metadata: {
                    orderId: order.id,
                    barId: order.barId,
                    sessionId: order.sessionId
                },
                line_items: [
                    {
                        quantity: 1,
                        price_data: {
                            currency,
                            unit_amount: amountInMinorUnits,
                            product_data: {
                                name: `${order.bar.name} custom cocktail`
                            }
                        }
                    }
                ],
                success_url: successUrl,
                cancel_url: cancelUrl
            });
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
            if (requester.role === user_role_enum_1.UserRole.staff) {
                if (!requester.barId || requester.barId !== bar.id) {
                    throw new common_1.ForbiddenException('Staff users can only access their assigned bar');
                }
            }
            else if (requester.role !== user_role_enum_1.UserRole.admin) {
                throw new common_1.ForbiddenException('User is not permitted to view orders');
            }
        }
        if (status && !Object.values(OrderStatusValues).includes(status)) {
            throw new common_1.BadRequestException('Invalid status filter');
        }
        const orders = await this.prisma.order.findMany({
            where: {
                barId: bar.id,
                ...(status ? { status: status } : {})
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
            select: {
                id: true,
                status: true,
                createdAt: true,
                fulfilledAt: true
            }
        });
        return {
            items: orders.map((o) => ({
                id: o.id,
                status: o.status,
                createdAt: o.createdAt.toISOString(),
                fulfilledAt: o.fulfilledAt?.toISOString() ?? null,
            })),
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
                    barId: true
                }
            });
            if (!order) {
                throw new common_1.NotFoundException('Order not found');
            }
            if (requester) {
                if (requester.role === user_role_enum_1.UserRole.staff) {
                    if (!requester.barId || requester.barId !== order.barId) {
                        throw new common_1.ForbiddenException('Staff users can only update orders for their bar');
                    }
                }
                else if (requester.role !== user_role_enum_1.UserRole.admin) {
                    throw new common_1.ForbiddenException('User is not permitted to update orders');
                }
            }
            if (order.status === OrderStatusValues.fulfilled) {
                if (!order.fulfilledAt) {
                    const updated = await this.prisma.order.update({
                        where: { id: order.id },
                        data: {
                            fulfilledAt: new Date()
                        },
                        select: {
                            id: true,
                            status: true,
                            fulfilledAt: true
                        }
                    });
                    return {
                        id: updated.id,
                        status: updated.status,
                        fulfilledAt: updated.fulfilledAt?.toISOString() ?? null
                    };
                }
                return {
                    id: order.id,
                    status: order.status,
                    fulfilledAt: order.fulfilledAt?.toISOString() ?? null
                };
            }
            if (order.status !== OrderStatusValues.paid) {
                throw new common_1.ConflictException('Only paid orders can be fulfilled');
            }
            const fulfilledAt = new Date();
            const updated = await this.prisma.order.update({
                where: { id: order.id },
                data: {
                    status: OrderStatusValues.fulfilled,
                    fulfilledAt
                },
                select: {
                    id: true,
                    status: true,
                    fulfilledAt: true
                }
            });
            return {
                id: updated.id,
                status: updated.status,
                fulfilledAt: updated.fulfilledAt?.toISOString() ?? null
            };
        });
    }
    async createForBar(barId, body, user) {
        const order = await this.prisma.order.create({
            data: {
                barId,
                status: 'created',
                amount: body.total ?? 0,
                items: {
                    create: body.items.map(i => ({
                        sku: i.sku,
                        qty: i.qty,
                    })),
                },
            },
            include: { items: true },
        });
        return order;
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], OrdersService);
//# sourceMappingURL=orders.service.js.map