import { BarsService } from './bars.service';
import type { BarListResponse, BarSettingsResponse, BarSummary } from './bars.service';
import { CreateBarDto } from './dto/create-bar.dto';
import { UpdateBarDto } from './dto/update-bar.dto';
import { UpdateBarSettingsDto } from './dto/update-bar-settings.dto';
import { ListBarsQueryDto } from './dto/list-bars-query.dto';
export declare class BarsController {
    private readonly barsService;
    constructor(barsService: BarsService);
    findAll(query: ListBarsQueryDto): Promise<BarListResponse>;
    create(dto: CreateBarDto): Promise<BarSummary>;
    findOne(id: string): Promise<BarSummary>;
    update(id: string, dto: UpdateBarDto): Promise<BarSummary>;
    findSettings(id: string): Promise<BarSettingsResponse>;
    updateSettings(id: string, dto: UpdateBarSettingsDto): Promise<BarSettingsResponse>;
    createAssetUpload(id: string): {
        uploadUrl: string;
        expiresAt: string;
    };
}
