import { BadRequestException, Controller, Get, Param, Query } from '@nestjs/common';
import { OrderStatus as PrismaOrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';

@Controller('bars')
export class BarOrdersController {
  private readonly allowedStatuses = new Set<string>(Object.values(PrismaOrderStatus));

  constructor(private readonly ordersService: OrdersService) {}

  @Get(':id/orders')
  listForBar(@Param('id') id: string, @Query('status') status?: string) {
    let normalized: PrismaOrderStatus | undefined;

    if (status) {
      const lowered = status.toLowerCase();
      if (!this.allowedStatuses.has(lowered)) {
        throw new BadRequestException('Invalid status filter');
      }
      normalized = lowered as PrismaOrderStatus;
    }

    return this.ordersService.listForBar(id, normalized);
  }
}
