import { BadRequestException, Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { OrderStatus as PrismaOrderStatus , UserRole } from '@prisma/client';

import { OrdersService } from './orders.service';
import { ApiAuthGuard } from '../common/guards/api-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@UseGuards(ApiAuthGuard, RolesGuard)
@Roles(UserRole.admin, UserRole.staff)
@Controller('bars')
export class BarOrdersController {
  private readonly allowedStatuses = new Set<string>(Object.values(PrismaOrderStatus));

  constructor(private readonly ordersService: OrdersService) {}

  @Get(':id/orders')
  listForBar(
    @Param('id') id: string,
    @Query('status') status: string | undefined,
    @Req() request: AuthenticatedRequest
  ) {
    let normalized: PrismaOrderStatus | undefined;

    if (status) {
      const lowered = status.toLowerCase();
      if (!this.allowedStatuses.has(lowered)) {
        throw new BadRequestException('Invalid status filter');
      }
      normalized = lowered as PrismaOrderStatus;
    }

    return this.ordersService.listForBar(id, normalized, request.user);
  }
}
