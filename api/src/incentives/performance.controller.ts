import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { ApiAuthGuard } from '../common/guards/api-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { PerformanceService } from './performance.service';

@UseGuards(ApiAuthGuard, RolesGuard)
@Roles(UserRole.admin, UserRole.staff)
@Controller()
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get('bars/:barId/performance/current')
  getCurrentPerformance(
    @Param('barId') barId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    this.assertBarAccess(req, barId);
    return this.performanceService.getCurrentPerformance(barId);
  }

  @Get('bars/:barId/performance/history')
  getHistory(
    @Param('barId') barId: string,
    @Query('weeks') weeks: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    this.assertBarAccess(req, barId);
    const parsedWeeks = weeks ? parseInt(weeks, 10) : 12;
    return this.performanceService.getHistory(barId, parsedWeeks);
  }

  @Get('performance/leaderboard')
  getLeaderboard() {
    return this.performanceService.getLeaderboard();
  }

  private assertBarAccess(req: AuthenticatedRequest, barId: string) {
    if (req.user.role === UserRole.staff && req.user.barId !== barId) {
      throw new ForbiddenException('Staff can only view performance for their own bar');
    }
  }
}
