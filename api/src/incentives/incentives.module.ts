import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { IncentivesService } from './incentives.service';
import { PerformanceService } from './performance.service';
import { IncentivesController } from './incentives.controller';
import { PerformanceController } from './performance.controller';
import { EventsController } from './events.controller';
import { ApiAuthGuard } from '../common/guards/api-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  imports: [PrismaModule],
  controllers: [IncentivesController, PerformanceController, EventsController],
  providers: [IncentivesService, PerformanceService, ApiAuthGuard, RolesGuard],
  exports: [IncentivesService, PerformanceService],
})
export class IncentivesModule {}
