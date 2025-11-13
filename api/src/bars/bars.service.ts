import {
  ConflictException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBarDto } from './dto/create-bar.dto';
import { UpdateBarDto } from './dto/update-bar.dto';
import { UpdateBarSettingsDto } from './dto/update-bar-settings.dto';
import { ListBarsQueryDto } from './dto/list-bars-query.dto';

// FIX(build): export bar summary type for controller responses.
export interface BarSummary {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  active: boolean;
  theme: Record<string, string> | null;
  pricingPounds: number | null;
}

// FIX(build): export bar settings response type for controller responses.
export type StructuredRecord = Record<string, string>;

export interface BarSettingsResponse {
  id: string;
  name: string;
  slug: string;
  introText: string | null;
  outroText: string | null;
  theme: Record<string, string>;
  pricingPounds: number;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: StructuredRecord | null;
  openingHours: StructuredRecord | null;
  stock: string[];
  stockListUrl: string | null;
  bankDetails: StructuredRecord | null;
  stripeConnectId: string | null;
  stripeConnectLink: string | null;
  brandPalette: StructuredRecord | null;
  logoUrl: string | null;
}

const DEFAULT_THEME: Record<string, string> = {
  primary: '#2f27ce',
  background: '#050315',
  foreground: '#fbfbfe',
  card: '#121129'
};

const DEFAULT_PALETTE: StructuredRecord = {
  dominant: '#050315',
  secondary: '#2f27ce',
  accent: '#dedcff'
};

export interface BarListResponse {
  items: BarSummary[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    pageCount: number;
  };
}

@Injectable()
export class BarsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListBarsQueryDto): Promise<BarListResponse> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const skip = (page - 1) * pageSize;

    const where: Prisma.BarWhereInput = {};

    if (query.status) {
      where.active = query.status === 'active';
    } else if (typeof query.active === 'string') {
      where.active = query.active === 'true';
    }

    if (query.search) {
      const term = query.search.trim();
      if (term.length > 0) {
        where.OR = [
          { name: { contains: term, mode: 'insensitive' } },
          { slug: { contains: term, mode: 'insensitive' } },
          { location: { contains: term, mode: 'insensitive' } }
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

  async create(dto: CreateBarDto): Promise<BarSummary> {
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
              pricingPounds: new Prisma.Decimal(12),
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
    } catch (error) {
      this.handleUniqueConstraint(error);
      throw error;
    }
  }

  async findOne(identifier: string): Promise<BarSummary> {
    const bar = await this.prisma.bar.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }]
      },
      include: {
        settings: true
      }
    });

    if (!bar) {
      throw new NotFoundException('Bar not found');
    }

    return this.mapDetail(bar);
  }

  async update(identifier: string, dto: UpdateBarDto): Promise<BarSummary> {
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
    } catch (error) {
      this.handleUniqueConstraint(error);
      throw error;
    }
  }

  async findSettings(identifier: string): Promise<BarSettingsResponse> {
    const bar = await this.prisma.bar.findFirst({
      where: {
        OR: [{ slug: identifier }, { id: identifier }]
      },
      include: { settings: true }
    });

    if (!bar || !bar.settings) {
      throw new NotFoundException('Bar settings not found');
    }

    return this.mapSettings(bar);
  }

  async updateSettings(
    identifier: string,
    dto: UpdateBarSettingsDto,
  ): Promise<BarSettingsResponse> {
    const bar = await this.ensureBar(identifier, true);
    const existingSettings = bar.settings ?? null;
    const existingTheme = (existingSettings?.theme as Record<string, string> | undefined) ?? undefined;
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
        pricingPounds:
          typeof dto.pricingPounds === 'number'
            ? new Prisma.Decimal(dto.pricingPounds)
            : existingSettings?.pricingPounds ?? new Prisma.Decimal(12),
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
        pricingPounds:
          typeof dto.pricingPounds === 'number'
            ? new Prisma.Decimal(dto.pricingPounds)
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
      throw new NotFoundException('Bar settings not found');
    }

    return this.mapSettings(refreshed);
  }

  createAssetUpload(id: string) {
    return {
      uploadUrl: `https://example.com/upload/${id}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    };
  }

  private mapSummary(bar: Prisma.BarGetPayload<{ include: { settings: true } }>): BarSummary {
    const theme = bar.settings
      ? { ...DEFAULT_THEME, ...(bar.settings.theme as Record<string, string>) }
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

  private mapDetail(bar: Prisma.BarGetPayload<{ include: { settings: true } }>): BarSummary {
    return {
      ...this.mapSummary(bar)
    };
  }

  private mapSettings(bar: Prisma.BarGetPayload<{ include: { settings: true } }>): BarSettingsResponse {
    if (!bar.settings) {
      throw new NotFoundException('Bar settings not found');
    }

    const theme = {
      ...DEFAULT_THEME,
      ...(bar.settings.theme as Record<string, string> | null | undefined)
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

  private async ensureBar(
    identifier: string,
    includeSettings: true
  ): Promise<Prisma.BarGetPayload<{ include: { settings: true } }>>;
  private async ensureBar(
    identifier: string,
    includeSettings?: false
  ): Promise<Prisma.BarGetPayload<{}>>;
  private async ensureBar(identifier: string, includeSettings = false) {
    const bar = await this.prisma.bar.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }]
      },
      include: includeSettings ? { settings: true } : undefined
    });

    if (!bar) {
      throw new NotFoundException('Bar not found');
    }

    return bar;
  }

  private normalizeDecimal(value: Prisma.Decimal | number): number {
    if (typeof value === 'number') {
      return value;
    }
    return value.toNumber();
  }

  private sanitizeRecord(input?: Record<string, string> | null): StructuredRecord | null {
    if (!input) {
      return null;
    }

    const trimmedEntries = Object.entries(input).reduce<StructuredRecord>((acc, [key, value]) => {
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

  private sanitizeStock(items: string[]): string[] {
    return items
      .map((item) => (typeof item === 'string' ? item.trim() : ''))
      .filter((item) => item.length > 0);
  }

  private normalizeRecord(value: Prisma.JsonValue | null): StructuredRecord | null {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return null;
    }

    const entries = Object.entries(value as Record<string, unknown>).reduce<StructuredRecord>(
      (acc, [key, val]) => {
        if (typeof val !== 'string') {
          return acc;
        }
        const trimmed = val.trim();
        if (trimmed.length === 0) {
          return acc;
        }
        acc[key] = trimmed;
        return acc;
      },
      {}
    );

    return Object.keys(entries).length > 0 ? entries : null;
  }

  private normalizeStringArray(value: Prisma.JsonValue | null): string[] {
    if (!value) {
      return [];
    }

    if (Array.isArray(value)) {
      return value
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
    }

    if (typeof value === 'object') {
      return Object.values(value as Record<string, unknown>)
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
    }

    return [];
  }

  private prepareJsonValue(value: unknown | null): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    if (value === null || value === undefined) {
      return Prisma.JsonNull;
    }
    return value as Prisma.InputJsonValue;
  }

  private prepareJsonUpdate(
    value: unknown | null | undefined
  ): Prisma.InputJsonValue | typeof Prisma.JsonNull | undefined {
    if (value === undefined) {
      return undefined;
    }
    return this.prepareJsonValue(value);
  }

  private handleUniqueConstraint(error: unknown): void {
    // FIX(build): use Prisma namespace error type for compatibility with generated client.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('A bar with this slug already exists');
    }
  }
}
