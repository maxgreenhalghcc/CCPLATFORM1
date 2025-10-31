import { PrismaService } from '../prisma/prisma.service';
import { CreateBarDto } from './dto/create-bar.dto';
import { UpdateBarDto } from './dto/update-bar.dto';
import { UpdateBarSettingsDto } from './dto/update-bar-settings.dto';
import { ListBarsQueryDto } from './dto/list-bars-query.dto';
export interface BarSummary {
    id: string;
    name: string;
    slug: string;
    location: string | null;
    active: boolean;
    theme: Record<string, string> | null;
    pricingPounds: number | null;
}
export interface BarSettingsResponse {
    id: string;
    name: string;
    slug: string;
    introText: string | null;
    outroText: string | null;
    theme: Record<string, string>;
    pricingPounds: number;
}
export interface BarListResponse {
    items: BarSummary[];
    meta: {
        total: number;
        page: number;
        pageSize: number;
        pageCount: number;
    };
}
export declare class BarsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(query: ListBarsQueryDto): Promise<BarListResponse>;
    create(dto: CreateBarDto): Promise<BarSummary>;
    findOne(identifier: string): Promise<BarSummary>;
    update(identifier: string, dto: UpdateBarDto): Promise<BarSummary>;
    findSettings(identifier: string): Promise<BarSettingsResponse>;
    updateSettings(identifier: string, dto: UpdateBarSettingsDto): Promise<BarSettingsResponse>;
    createAssetUpload(id: string): {
        uploadUrl: string;
        expiresAt: string;
    };
    private mapSummary;
    private mapDetail;
    private mapSettings;
    private ensureBar;
    private normalizeDecimal;
    private handleUniqueConstraint;
}
