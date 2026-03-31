import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PayoutStatus, UserRole } from '@prisma/client';

import { ApiAuthGuard } from '../common/guards/api-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { IncentivesService } from './incentives.service';
import { PerformanceService } from './performance.service';
import { CreateTierDto } from './dto/create-tier.dto';
import { UpdateTierDto } from './dto/update-tier.dto';

@UseGuards(ApiAuthGuard, RolesGuard)
@Roles(UserRole.admin)
@Controller('admin')
export class IncentivesController {
  constructor(
    private readonly incentivesService: IncentivesService,
    private readonly performanceService: PerformanceService,
  ) {}

  // ── Tiers ─────────────────────────────────────────────────────────────────

  @Get('bars/:barId/incentive-tiers')
  listTiers(@Param('barId') barId: string) {
    return this.incentivesService.listTiers(barId);
  }

  @Post('bars/:barId/incentive-tiers')
  createTier(@Param('barId') barId: string, @Body() dto: CreateTierDto) {
    return this.incentivesService.createTier(barId, dto);
  }

  @Patch('bars/:barId/incentive-tiers/:tierId')
  updateTier(
    @Param('barId') barId: string,
    @Param('tierId') tierId: string,
    @Body() dto: UpdateTierDto,
  ) {
    return this.incentivesService.updateTier(barId, tierId, dto);
  }

  @Delete('bars/:barId/incentive-tiers/:tierId')
  deleteTier(@Param('barId') barId: string, @Param('tierId') tierId: string) {
    return this.incentivesService.deleteTier(barId, tierId);
  }

  // ── Baseline ──────────────────────────────────────────────────────────────

  @Patch('bars/:barId/baseline')
  setBaseline(@Param('barId') barId: string, @Body() body: { baseline: number }) {
    return this.incentivesService.setBaseline(barId, body.baseline);
  }

  // ── Payouts ───────────────────────────────────────────────────────────────

  @Get('payouts')
  listPayouts(@Query('status') status?: string) {
    const parsed =
      status && Object.values(PayoutStatus).includes(status as PayoutStatus)
        ? (status as PayoutStatus)
        : undefined;
    return this.incentivesService.listPayouts(parsed);
  }

  @Patch('payouts/:id')
  markPayoutPaid(@Param('id') id: string) {
    return this.incentivesService.markPayoutPaid(id);
  }

  // ── Funnel analytics ──────────────────────────────────────────────────────

  @Get('bars/:barId/funnel')
  getFunnelForBar(
    @Param('barId') barId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.incentivesService.getFunnelForBar(barId, from, to);
  }

  @Get('funnel/summary')
  getFunnelSummary() {
    return this.incentivesService.getFunnelSummary();
  }

  // ── Manual rollup trigger ─────────────────────────────────────────────────

  @Post('performance/rollup')
  triggerRollup(@Query('week') week?: string) {
    const weekStart = week ? new Date(week) : undefined;
    return this.performanceService.runWeeklyRollup(weekStart);
  }
}
