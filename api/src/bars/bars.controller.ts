import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { BarsService } from './bars.service';
import { CreateBarDto } from './dto/create-bar.dto';
import { UpdateBarDto } from './dto/update-bar.dto';
import { UpdateBarSettingsDto } from './dto/update-bar-settings.dto';
import { ListBarsQueryDto } from './dto/list-bars-query.dto';
import { ApiAuthGuard } from '../common/guards/api-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('bars')
export class BarsController {
  constructor(private readonly barsService: BarsService) {}

  @Get()
  @UseGuards(ApiAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  findAll(@Query() query: ListBarsQueryDto) {
    return this.barsService.findAll(query);
  }

  @Post()
  @UseGuards(ApiAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  create(@Body() dto: CreateBarDto) {
    return this.barsService.create(dto);
  }

  @Get(':id')
  @UseGuards(ApiAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  findOne(@Param('id') id: string) {
    return this.barsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(ApiAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  update(@Param('id') id: string, @Body() dto: UpdateBarDto) {
    return this.barsService.update(id, dto);
  }

  @Get(':id/settings')
  findSettings(@Param('id') id: string) {
    return this.barsService.findSettings(id);
  }

  @Put(':id/settings')
  @UseGuards(ApiAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  updateSettings(@Param('id') id: string, @Body() dto: UpdateBarSettingsDto) {
    return this.barsService.updateSettings(id, dto);
  }

  @Post(':id/assets')
  @UseGuards(ApiAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  createAssetUpload(@Param('id') id: string) {
    return this.barsService.createAssetUpload(id);
  }
}
