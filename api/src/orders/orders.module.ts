import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { BarOrdersController } from './bar-orders.controller';
import { OrdersService } from './orders.service';
import { DevAuthGuard } from '../common/guards/dev-auth.guard';

@Module({
  controllers: [OrdersController, BarOrdersController],
  providers: [OrdersService, DevAuthGuard],
  exports: [OrdersService]
})
export class OrdersModule {}
