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
    primary: '#2f27ce',
    background: '#050315',
    foreground: '#fbfbfe',
    card: '#121129'
};
const DEFAULT_PALETTE = {
    dominant: '#050315',
    secondary: '#2f27ce',
    accent: '#dedcff'
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
                            pricingPounds: new client_1.Prisma.Decimal(12),
                            contactName: null,
                            contactEmail: null,
                            contactPhone: null,
                            address: this.prepareJsonValue(null),
                            openingHours: this.prepareJsonValue(null),
                            stock: this.prepareJsonValue([]),
                            stockListUrl: null,
                            bankDetails: this.prepareJsonValue(null),
                            stripeConnectId: null,
                            stripeConnectLink: null,
                            brandPalette: this.prepareJsonValue(DEFAULT_PALETTE),
                            logoUrl: null
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
        const existingSettings = bar.settings ?? null;
        const existingTheme = existingSettings?.theme ?? undefined;
        const mergedTheme = dto.theme
            ? { ...DEFAULT_THEME, ...(existingTheme ?? {}), ...dto.theme }
            : existingTheme ?? DEFAULT_THEME;
        const existingAddress = this.normalizeRecord(existingSettings?.address ?? null);
        const existingOpening = this.normalizeRecord(existingSettings?.openingHours ?? null);
        const existingBank = this.normalizeRecord(existingSettings?.bankDetails ?? null);
        const existingPalette = this.normalizeRecord(existingSettings?.brandPalette ?? null);
        const existingStock = this.normalizeStringArray(existingSettings?.stock ?? null);
        const sanitizedAddress = dto.address !== undefined ? this.sanitizeRecord(dto.address) : undefined;
        const sanitizedOpening = dto.openingHours !== undefined ? this.sanitizeRecord(dto.openingHours) : undefined;
        const sanitizedBank = dto.bankDetails !== undefined ? this.sanitizeRecord(dto.bankDetails) : undefined;
        const sanitizedPalette = dto.brandPalette !== undefined ? this.sanitizeRecord(dto.brandPalette) : undefined;
        const sanitizedStock = dto.stock !== undefined ? this.sanitizeStock(dto.stock) : undefined;
        const createPalette = sanitizedPalette
            ? { ...DEFAULT_PALETTE, ...sanitizedPalette }
            : existingPalette
                ? { ...DEFAULT_PALETTE, ...existingPalette }
                : DEFAULT_PALETTE;
        const updatePalette = sanitizedPalette !== undefined
            ? sanitizedPalette
                ? { ...DEFAULT_PALETTE, ...sanitizedPalette }
                : DEFAULT_PALETTE
            : undefined;
        await this.prisma.barSettings.upsert({
            where: { barId: bar.id },
            create: {
                barId: bar.id,
                theme: mergedTheme,
                introText: dto.introText ?? existingSettings?.introText ?? null,
                outroText: dto.outroText ?? existingSettings?.outroText ?? null,
                quizPaused: dto.quizPaused ?? existingSettings?.quizPaused ?? false,
                pricingPounds: typeof dto.pricingPounds === 'number'
                    ? new client_1.Prisma.Decimal(dto.pricingPounds)
                    : existingSettings?.pricingPounds ?? new client_1.Prisma.Decimal(12),
                contactName: dto.contactName ?? existingSettings?.contactName ?? null,
                contactEmail: dto.contactEmail ?? existingSettings?.contactEmail ?? null,
                contactPhone: dto.contactPhone ?? existingSettings?.contactPhone ?? null,
                address: this.prepareJsonValue(sanitizedAddress ?? existingAddress ?? null),
                openingHours: this.prepareJsonValue(sanitizedOpening ?? existingOpening ?? null),
                stock: this.prepareJsonValue(sanitizedStock ?? existingStock ?? []),
                stockListUrl: dto.stockListUrl ?? existingSettings?.stockListUrl ?? null,
                bankDetails: this.prepareJsonValue(sanitizedBank ?? existingBank ?? null),
                stripeConnectId: dto.stripeConnectId ?? existingSettings?.stripeConnectId ?? null,
                stripeConnectLink: dto.stripeConnectLink ?? existingSettings?.stripeConnectLink ?? null,
                brandPalette: this.prepareJsonValue(createPalette),
                logoUrl: dto.logoUrl ?? existingSettings?.logoUrl ?? null,
            },
            update: {
                theme: mergedTheme,
                introText: dto.introText !== undefined ? dto.introText : undefined,
                outroText: dto.outroText !== undefined ? dto.outroText : undefined,
                quizPaused: dto.quizPaused !== undefined ? dto.quizPaused : undefined,
                pricingPounds: typeof dto.pricingPounds === 'number'
                    ? new client_1.Prisma.Decimal(dto.pricingPounds)
                    : undefined,
                contactName: dto.contactName !== undefined ? dto.contactName ?? null : undefined,
                contactEmail: dto.contactEmail !== undefined ? dto.contactEmail ?? null : undefined,
                contactPhone: dto.contactPhone !== undefined ? dto.contactPhone ?? null : undefined,
                address: this.prepareJsonUpdate(sanitizedAddress !== undefined ? sanitizedAddress ?? null : undefined),
                openingHours: this.prepareJsonUpdate(sanitizedOpening !== undefined ? sanitizedOpening ?? null : undefined),
                stock: this.prepareJsonUpdate(sanitizedStock !== undefined ? sanitizedStock : undefined),
                stockListUrl: dto.stockListUrl !== undefined ? dto.stockListUrl ?? null : undefined,
                bankDetails: this.prepareJsonUpdate(sanitizedBank !== undefined ? sanitizedBank ?? null : undefined),
                stripeConnectId: dto.stripeConnectId !== undefined ? dto.stripeConnectId ?? null : undefined,
                stripeConnectLink: dto.stripeConnectLink !== undefined ? dto.stripeConnectLink ?? null : undefined,
                brandPalette: this.prepareJsonUpdate(updatePalette),
                logoUrl: dto.logoUrl !== undefined ? dto.logoUrl ?? null : undefined,
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
        const address = this.normalizeRecord(bar.settings.address ?? null);
        const openingHours = this.normalizeRecord(bar.settings.openingHours ?? null);
        const stock = this.normalizeStringArray(bar.settings.stock ?? null);
        const bankDetails = this.normalizeRecord(bar.settings.bankDetails ?? null);
        const paletteRecord = this.normalizeRecord(bar.settings.brandPalette ?? null);
        const brandPalette = paletteRecord
            ? { ...DEFAULT_PALETTE, ...paletteRecord }
            : { ...DEFAULT_PALETTE };
        return {
            id: bar.id,
            name: bar.name,
            slug: bar.slug,
            introText: bar.settings.introText ?? null,
            outroText: bar.settings.outroText ?? null,
            quizPaused: bar.settings.quizPaused ?? false,
            theme,
            pricingPounds: safePricing,
            contactName: bar.settings.contactName ?? null,
            contactEmail: bar.settings.contactEmail ?? null,
            contactPhone: bar.settings.contactPhone ?? null,
            address,
            openingHours,
            stock,
            stockListUrl: bar.settings.stockListUrl ?? null,
            bankDetails,
            stripeConnectId: bar.settings.stripeConnectId ?? null,
            stripeConnectLink: bar.settings.stripeConnectLink ?? null,
            brandPalette,
            logoUrl: bar.settings.logoUrl ?? null
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
    sanitizeRecord(input) {
        if (!input) {
            return null;
        }
        const trimmedEntries = Object.entries(input).reduce((acc, [key, value]) => {
            if (typeof value !== 'string') {
                return acc;
            }
            const trimmed = value.trim();
            if (trimmed.length === 0) {
                return acc;
            }
            acc[key] = trimmed;
            return acc;
        }, {});
        return Object.keys(trimmedEntries).length > 0 ? trimmedEntries : null;
    }
    sanitizeStock(items) {
        return items
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .filter((item) => item.length > 0);
    }
    normalizeRecord(value) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
            return null;
        }
        const entries = Object.entries(value).reduce((acc, [key, val]) => {
            if (typeof val !== 'string') {
                return acc;
            }
            const trimmed = val.trim();
            if (trimmed.length === 0) {
                return acc;
            }
            acc[key] = trimmed;
            return acc;
        }, {});
        return Object.keys(entries).length > 0 ? entries : null;
    }
    normalizeStringArray(value) {
        if (!value) {
            return [];
        }
        if (Array.isArray(value)) {
            return value
                .filter((entry) => typeof entry === 'string')
                .map((entry) => entry.trim())
                .filter((entry) => entry.length > 0);
        }
        if (typeof value === 'object') {
            return Object.values(value)
                .filter((entry) => typeof entry === 'string')
                .map((entry) => entry.trim())
                .filter((entry) => entry.length > 0);
        }
        return [];
    }
    prepareJsonValue(value) {
        if (value === null || value === undefined) {
            return client_1.Prisma.JsonNull;
        }
        return value;
    }
    prepareJsonUpdate(value) {
        if (value === undefined) {
            return undefined;
        }
        return this.prepareJsonValue(value);
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