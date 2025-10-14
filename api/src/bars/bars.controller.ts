import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { BarsService } from './bars.service';
import { CreateBarDto } from './dto/create-bar.dto';
import { UpdateBarDto } from './dto/update-bar.dto';
import { UpdateBarSettingsDto } from './dto/update-bar-settings.dto';

@Controller('bars')
export class BarsController {
  constructor(private readonly barsService: BarsService) {}

  @Get()
  findAll() {
    return this.barsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateBarDto) {
    return this.barsService.create(dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.barsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBarDto) {
    return this.barsService.update(id, dto);
  }

  @Get(':id/settings')
  findSettings(@Param('id') id: string) {
    return this.barsService.findSettings(id);
  }

  @Put(':id/settings')
  updateSettings(@Param('id') id: string, @Body() dto: UpdateBarSettingsDto) {
    return this.barsService.updateSettings(id, dto);
  }

  @Post(':id/assets')
  createAssetUpload(@Param('id') id: string) {
    return this.barsService.createAssetUpload(id);
  }
}
