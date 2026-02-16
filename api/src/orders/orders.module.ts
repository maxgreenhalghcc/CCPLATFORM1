import { Module } from '@nestjs/common';

import { OrdersController } from './orders.controller';
import { BarOrdersController } from './bar-orders.controller';
import { OrdersSseController } from './orders-sse.controller';
import { OrdersService } from './orders.service';
import { OrderEventsService } from './order-events.service';
import { ApiAuthGuard } from '../common/guards/api-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  controllers: [OrdersController, BarOrdersController, OrdersSseController],
  providers: [OrdersService, OrderEventsService, ApiAuthGuard, RolesGuard],
  exports: [OrdersService, OrderEventsService]
})
export class OrdersModule {}
