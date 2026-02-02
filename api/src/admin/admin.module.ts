import { Module } from '@nestjs/common';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ApiAuthGuard } from '../common/guards/api-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  controllers: [AdminController],
  providers: [AdminService, ApiAuthGuard, RolesGuard]
})
export class AdminModule {}
