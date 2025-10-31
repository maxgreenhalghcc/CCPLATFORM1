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
var WebhooksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksService = void 0;
const client_1 = require("@prisma/client");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const stripe_1 = require("stripe");
const prisma_service_1 = require("../prisma/prisma.service");
let WebhooksService = WebhooksService_1 = class WebhooksService {
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(WebhooksService_1.name);
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
    async handleStripe(signature, payload) {
        const webhookSecret = this.configService.get('stripe.webhookSecret');
        const nodeEnv = this.configService.get('nodeEnv');
        let event;
        if (!webhookSecret && nodeEnv !== 'development') {
            this.logger.error('Stripe webhook secret is not configured.');
            throw new common_1.BadRequestException('Stripe webhook secret is required');
        }
        if (webhookSecret) {
            if (!signature) {
                throw new common_1.BadRequestException('Missing Stripe signature header');
            }
            try {
                event = this.getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
            }
            catch (error) {
                this.logger.error(`Stripe webhook signature verification failed: ${error}`);
                throw new common_1.BadRequestException('Invalid Stripe signature');
            }
        }
        else {
            this.logger.warn('Stripe webhook secret is not configured. Parsing payload without verification.');
            try {
                event = JSON.parse(payload.toString('utf-8'));
            }
            catch (error) {
                throw new common_1.BadRequestException('Unable to parse webhook payload');
            }
        }
        await this.processEvent(event);
        return {
            received: true
        };
    }
    async processEvent(event) {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const orderId = session.metadata?.orderId;
            if (!orderId) {
                this.logger.warn('Checkout session completed without order metadata.');
                return;
            }
            const order = await this.prisma.order.findUnique({
                where: { id: orderId },
                select: { id: true, amount: true }
            });
            if (!order) {
                this.logger.warn(`Order ${orderId} not found for Stripe webhook.`);
                return;
            }
            const amount = session.amount_total != null
                ? new client_1.Prisma.Decimal(session.amount_total).dividedBy(100)
                : order.amount;
            const paymentStatus = session.payment_status ?? 'unknown';
            const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : null;
            const intentReference = paymentIntentId ?? event.id;
            await this.prisma.order.update({
                where: { id: orderId },
                data: { status: client_1.OrderStatus.paid }
            });
            const existing = await this.prisma.payment.findFirst({
                where: { intentId: intentReference }
            });
            if (existing) {
                await this.prisma.payment.update({
                    where: { id: existing.id },
                    data: {
                        amount,
                        status: paymentStatus,
                        raw: event
                    }
                });
                return;
            }
            await this.prisma.payment.create({
                data: {
                    orderId,
                    intentId: intentReference,
                    amount,
                    status: paymentStatus,
                    raw: event
                }
            });
        }
    }
};
exports.WebhooksService = WebhooksService;
exports.WebhooksService = WebhooksService = WebhooksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], WebhooksService);
//# sourceMappingURL=webhooks.service.js.map