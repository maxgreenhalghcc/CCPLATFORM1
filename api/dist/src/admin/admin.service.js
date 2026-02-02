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
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const Sentry = require("@sentry/node");
const prisma_service_1 = require("../prisma/prisma.service");
let AdminService = class AdminService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    resolveRange(range) {
        const fallbackDays = 30;
        const match = range?.match(/^(\d+)d$/i);
        const days = match ? parseInt(match[1], 10) : fallbackDays;
        const boundedDays = Number.isFinite(days) && days > 0 ? Math.min(days, 365) : fallbackDays;
        const to = new Date();
        const from = new Date(to.getTime() - boundedDays * 24 * 60 * 60 * 1000);
        return {
            from,
            to,
            label: `${boundedDays}d`
        };
    }
    toDateKey(date) {
        return date.toISOString().slice(0, 10);
    }
    async getRevenue(barId, range) {
        return Sentry.startSpan({ name: 'admin.metrics.revenue', op: 'service' }, async () => {
            const { from, to, label } = this.resolveRange(range);
            const orders = await this.prisma.order.findMany({
                where: {
                    status: client_1.OrderStatus.paid,
                    createdAt: {
                        gte: from,
                        lte: to
                    },
                    ...(barId ? { barId } : {})
                },
                select: {
                    amount: true,
                    createdAt: true
                },
                orderBy: {
                    createdAt: 'asc'
                }
            });
            const seriesMap = new Map();
            let total = 0;
            for (const order of orders) {
                const amount = order.amount.toNumber();
                total += amount;
                const key = this.toDateKey(order.createdAt);
                seriesMap.set(key, (seriesMap.get(key) ?? 0) + amount);
            }
            const series = Array.from(seriesMap.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, value]) => ({
                date,
                value: Number(value.toFixed(2))
            }));
            return {
                barId: barId ?? null,
                range: label,
                currency: 'GBP',
                total: Number(total.toFixed(2)),
                series
            };
        });
    }
    async getOrders(barId, range) {
        return Sentry.startSpan({ name: 'admin.metrics.orders', op: 'service' }, async () => {
            const { from, to, label } = this.resolveRange(range);
            const orders = await this.prisma.order.findMany({
                where: {
                    createdAt: {
                        gte: from,
                        lte: to
                    },
                    ...(barId ? { barId } : {})
                },
                select: {
                    createdAt: true
                },
                orderBy: {
                    createdAt: 'asc'
                }
            });
            const seriesMap = new Map();
            for (const order of orders) {
                const key = this.toDateKey(order.createdAt);
                seriesMap.set(key, (seriesMap.get(key) ?? 0) + 1);
            }
            const series = Array.from(seriesMap.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([date, count]) => ({
                date,
                count
            }));
            return {
                barId: barId ?? null,
                range: label,
                total: orders.length,
                series
            };
        });
    }
    getIngredients(barId, range) {
        return {
            barId: barId ?? null,
            range: range ?? '30d',
            top: [
                { ingredient: 'Lime Juice', usageCount: 180 },
                { ingredient: 'Simple Syrup', usageCount: 150 },
                { ingredient: 'Gin', usageCount: 120 }
            ]
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminService);
//# sourceMappingURL=admin.service.js.map