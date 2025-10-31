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
exports.BarsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const DEFAULT_THEME = {
    primary: '#7c3aed',
    background: '#0b0b12',
    foreground: '#ffffff',
    card: '#1f1f2e'
};
let BarsService = class BarsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(query) {
        const page = query.page ?? 1;
        const pageSize = query.pageSize ?? 10;
        const skip = (page - 1) * pageSize;
        const where = {};
        if (query.status) {
            where.active = query.status === 'active';
        }
        else if (typeof query.active === 'string') {
            where.active = query.active === 'true';
        }
        if (query.search) {
            const term = query.search.trim();
            if (term.length > 0) {
                where.OR = [
                    { name: { contains: term } },
                    { slug: { contains: term } },
                    { location: { contains: term } }
                ];
            }
        }
        const [bars, total] = await this.prisma.$transaction([
            this.prisma.bar.findMany({
                where,
                orderBy: { name: 'asc' },
                skip,
                take: pageSize,
                include: { settings: true }
            }),
            this.prisma.bar.count({ where })
        ]);
        const items = bars.map((bar) => this.mapSummary(bar));
        return {
            items,
            meta: {
                total,
                page,
                pageSize,
                pageCount: total === 0 ? 1 : Math.ceil(total / pageSize)
            }
        };
    }
    async create(dto) {
        try {
            const bar = await this.prisma.bar.create({
                data: {
                    name: dto.name,
                    slug: dto.slug,
                    location: dto.location,
                    active: dto.active ?? true,
                    settings: {
                        create: {
                            theme: DEFAULT_THEME,
                            introText: null,
                            outroText: null,
                            pricingPounds: new client_1.Prisma.Decimal(12)
                        }
                    }
                },
                include: { settings: true }
            });
            return this.mapDetail(bar);
        }
        catch (error) {
            this.handleUniqueConstraint(error);
            throw error;
        }
    }
    async findOne(identifier) {
        const bar = await this.prisma.bar.findFirst({
            where: {
                OR: [{ id: identifier }, { slug: identifier }]
            },
            include: {
                settings: true
            }
        });
        if (!bar) {
            throw new common_1.NotFoundException('Bar not found');
        }
        return this.mapDetail(bar);
    }
    async update(identifier, dto) {
        const bar = await this.ensureBar(identifier);
        try {
            const updated = await this.prisma.bar.update({
                where: { id: bar.id },
                data: {
                    name: dto.name ?? bar.name,
                    slug: dto.slug ?? bar.slug,
                    location: dto.location !== undefined ? dto.location : bar.location,
                    active: dto.active ?? bar.active
                },
                include: {
                    settings: true
                }
            });
            return this.mapDetail(updated);
        }
        catch (error) {
            this.handleUniqueConstraint(error);
            throw error;
        }
    }
    async findSettings(identifier) {
        const bar = await this.prisma.bar.findFirst({
            where: {
                OR: [{ slug: identifier }, { id: identifier }]
            },
            include: { settings: true }
        });
        if (!bar || !bar.settings) {
            throw new common_1.NotFoundException('Bar settings not found');
        }
        return this.mapSettings(bar);
    }
    async updateSettings(identifier, dto) {
        const bar = await this.ensureBar(identifier, true);
        const existingTheme = bar.settings?.theme ?? undefined;
        const mergedTheme = dto.theme
            ? { ...DEFAULT_THEME, ...(existingTheme ?? {}), ...dto.theme }
            : existingTheme ?? DEFAULT_THEME;
        await this.prisma.barSettings.upsert({
            where: { barId: bar.id },
            create: {
                barId: bar.id,
                theme: mergedTheme,
                introText: dto.introText ?? bar.settings?.introText ?? null,
                outroText: dto.outroText ?? bar.settings?.outroText ?? null,
                pricingPounds: dto.pricingPounds
                    ? new client_1.Prisma.Decimal(dto.pricingPounds)
                    : new client_1.Prisma.Decimal(12)
            },
            update: {
                theme: mergedTheme,
                introText: dto.introText !== undefined
                    ? dto.introText
                    : bar.settings?.introText ?? null,
                outroText: dto.outroText !== undefined
                    ? dto.outroText
                    : bar.settings?.outroText ?? null,
                pricingPounds: typeof dto.pricingPounds === 'number'
                    ? new client_1.Prisma.Decimal(dto.pricingPounds)
                    : bar.settings?.pricingPounds ?? new client_1.Prisma.Decimal(12)
            }
        });
        const refreshed = await this.prisma.bar.findUnique({
            where: { id: bar.id },
            include: { settings: true }
        });
        if (!refreshed || !refreshed.settings) {
            throw new common_1.NotFoundException('Bar settings not found');
        }
        return this.mapSettings(refreshed);
    }
    createAssetUpload(id) {
        return {
            uploadUrl: `https://example.com/upload/${id}`,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
        };
    }
    mapSummary(bar) {
        const theme = bar.settings
            ? { ...DEFAULT_THEME, ...bar.settings.theme }
            : null;
        const pricing = bar.settings
            ? Number(this.normalizeDecimal(bar.settings.pricingPounds))
            : null;
        const safePricing = pricing !== null && Number.isNaN(pricing) ? null : pricing;
        return {
            id: bar.id,
            name: bar.name,
            slug: bar.slug,
            location: bar.location ?? null,
            active: bar.active,
            theme,
            pricingPounds: safePricing
        };
    }
    mapDetail(bar) {
        return {
            ...this.mapSummary(bar)
        };
    }
    mapSettings(bar) {
        if (!bar.settings) {
            throw new common_1.NotFoundException('Bar settings not found');
        }
        const theme = {
            ...DEFAULT_THEME,
            ...bar.settings.theme
        };
        const pricing = Number(this.normalizeDecimal(bar.settings.pricingPounds));
        const safePricing = Number.isNaN(pricing) ? 0 : pricing;
        return {
            id: bar.id,
            name: bar.name,
            slug: bar.slug,
            introText: bar.settings.introText ?? null,
            outroText: bar.settings.outroText ?? null,
            theme,
            pricingPounds: safePricing
        };
    }
    async ensureBar(identifier, includeSettings = false) {
        const bar = await this.prisma.bar.findFirst({
            where: {
                OR: [{ id: identifier }, { slug: identifier }]
            },
            include: includeSettings ? { settings: true } : undefined
        });
        if (!bar) {
            throw new common_1.NotFoundException('Bar not found');
        }
        return bar;
    }
    normalizeDecimal(value) {
        if (typeof value === 'number') {
            return value;
        }
        return value.toNumber();
    }
    handleUniqueConstraint(error) {
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            throw new common_1.ConflictException('A bar with this slug already exists');
        }
    }
};
exports.BarsService = BarsService;
exports.BarsService = BarsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BarsService);
//# sourceMappingURL=bars.service.js.map