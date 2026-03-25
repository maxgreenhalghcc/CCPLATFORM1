import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards
} from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { UserRole } from '@prisma/client';

import { BarsService } from './bars.service';
import type {
  BarListResponse,
  BarSettingsResponse,
  BarSummary,
} from './bars.service';
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
  findAll(@Query() query: ListBarsQueryDto): Promise<BarListResponse> {
    return this.barsService.findAll(query);
  }

  @Post()
  @UseGuards(ApiAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  create(@Body() dto: CreateBarDto): Promise<BarSummary> {
    return this.barsService.create(dto);
  }

  @Get(':id')
  @UseGuards(ApiAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  findOne(@Param('id') id: string): Promise<BarSummary> {
    return this.barsService.findOne(id);
  }

  @Put(':id')
  @UseGuards(ApiAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  update(@Param('id') id: string, @Body() dto: UpdateBarDto): Promise<BarSummary> {
    return this.barsService.update(id, dto);
  }

  @Get(':id/settings')
  findSettings(@Param('id') id: string): Promise<BarSettingsResponse> {
    return this.barsService.findSettings(id);
  }

  @Put(':id/settings')
  @UseGuards(ApiAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  updateSettings(
    @Param('id') id: string,
    @Body() dto: UpdateBarSettingsDto,
  ): Promise<BarSettingsResponse> {
    return this.barsService.updateSettings(id, dto);
  }

  @Patch(':id/settings/quiz-paused')
  @UseGuards(ApiAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.staff)
  toggleQuizPaused(
    @Param('id') id: string,
    @Body() body: { quizPaused: boolean },
    @Req() req: Request & { user: AuthenticatedUser },
  ): Promise<{ quizPaused: boolean }> {
    return this.barsService.toggleQuizPaused(id, body.quizPaused, req.user);
  }

  @Post(':id/assets')
  @UseGuards(ApiAuthGuard, RolesGuard)
  @Roles(UserRole.admin)
  createAssetUpload(@Param('id') id: string) {
    return this.barsService.createAssetUpload(id);
  }
}
