import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DevAuthGuard } from '../common/guards/dev-auth.guard';

@Module({
  controllers: [AdminController],
  providers: [AdminService, DevAuthGuard]
})
export class AdminModule {}
