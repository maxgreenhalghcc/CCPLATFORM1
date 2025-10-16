import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { BarOrdersController } from './bar-orders.controller';
import { OrdersService } from './orders.service';

@Module({
  controllers: [OrdersController, BarOrdersController],
  providers: [OrdersService],
  exports: [OrdersService]
})
export class OrdersModule {}
