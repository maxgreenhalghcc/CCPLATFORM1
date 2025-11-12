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
export interface BarSettingsResponse {
  id: string;
  name: string;
  slug: string;
  introText: string | null;
  outroText: string | null;
  theme: Record<string, string>;
  pricingPounds: number;
}

const DEFAULT_THEME: Record<string, string> = {
  primary: '#7c3aed',
  background: '#0b0b12',
  foreground: '#ffffff',
  card: '#1f1f2e'
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
<<<<<<< HEAD
          { name: { contains: term } },
          { slug: { contains: term } },
          { location: { contains: term } }
=======
          { name: { contains: term, mode: 'insensitive' } },
          { slug: { contains: term, mode: 'insensitive' } },
          { location: { contains: term, mode: 'insensitive' } }
>>>>>>> pr-22
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
              pricingPounds: new Prisma.Decimal(12)
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

    const existingTheme = (bar.settings?.theme as Record<string, string> | undefined) ?? undefined;
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
          ? new Prisma.Decimal(dto.pricingPounds)
          : new Prisma.Decimal(12)
      },
      update: {
        theme: mergedTheme,
        introText:
          dto.introText !== undefined
            ? dto.introText
            : bar.settings?.introText ?? null,
        outroText:
          dto.outroText !== undefined
            ? dto.outroText
            : bar.settings?.outroText ?? null,
        pricingPounds:
          typeof dto.pricingPounds === 'number'
            ? new Prisma.Decimal(dto.pricingPounds)
            : bar.settings?.pricingPounds ?? new Prisma.Decimal(12)
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

  private handleUniqueConstraint(error: unknown): void {
    // FIX(build): use Prisma namespace error type for compatibility with generated client.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictException('A bar with this slug already exists');
    }
  }
}
