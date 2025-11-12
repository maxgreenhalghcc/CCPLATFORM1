<<<<<<< HEAD
import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Query,
  Req,
  UseGuards,
  Post,          // <-- add
  Body,          // <-- add
  HttpCode,  
} from '@nestjs/common';

import { ApiAuthGuard } from '../common/guards/api-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/roles/user-role.enum';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { OrdersService } from './orders.service';

// Prisma runtime (for $Enums) + TS types
import { Prisma } from '@prisma/client';

type CreateOrderBody = {
  items: { sku: string; qty: number }[];
  total?: number;
};


type OrderStatus = 'paid' | 'created' | 'cancelled' | 'fulfilled';

// ---- Runtime map of enum values (works across v4 & v5) ----
const OrderStatusValues: Record<string, OrderStatus> = (() => {
  const anyPrisma = Prisma as any;

  // v5: values live on Prisma.$Enums
  if (anyPrisma?.$Enums?.OrderStatus) {
    return anyPrisma.$Enums.OrderStatus as Record<string, OrderStatus>;
  }

  // v4: values were exposed directly on Prisma
  if (anyPrisma?.OrderStatus) {
    return anyPrisma.OrderStatus as Record<string, OrderStatus>;
  }

  // ultra-defensive fallback (shouldn’t be needed)
  return {
    paid: 'paid',
    created: 'created',
    cancelled: 'cancelled',
    fulfilled: 'fulfilled',
  } as unknown as Record<string, OrderStatus>;
})();

// Lowercase keys we’ll accept from the query (e.g. 'paid', 'created', …)
const AllowedStatusKeys = new Set(Object.keys(OrderStatusValues));
=======
import { BadRequestException, Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { OrderStatus as PrismaOrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';
import { ApiAuthGuard } from '../common/guards/api-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
>>>>>>> pr-22

@UseGuards(ApiAuthGuard, RolesGuard)
@Roles(UserRole.admin, UserRole.staff)
@Controller('bars')
export class BarOrdersController {
<<<<<<< HEAD
  constructor(private readonly ordersService: OrdersService) {}

  @Get(':id/orders')
  async listForBar(
    @Param('id') id: string,
    @Req() request: AuthenticatedRequest,          // <-- required comes BEFORE
    @Query('status') status?: string,              // <-- optional comes AFTER
  ) {
    let normalized: OrderStatus | undefined;

    if (status) {
      // normalize to lowercase to match enum keys
      const key = status.toLowerCase();

      if (!AllowedStatusKeys.has(key)) {
        throw new BadRequestException('Invalid status filter');
      }

      // map the lowercase key to the actual enum value
      normalized = OrderStatusValues[key as keyof typeof OrderStatusValues];
=======
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
>>>>>>> pr-22
    }

    return this.ordersService.listForBar(id, normalized, request.user);
  }
<<<<<<< HEAD
  
  @Post(':id/orders')
    @HttpCode(201)
    async createForBar(
      @Param('id') id: string,
      @Body() body: CreateOrderBody,
      @Req() request: AuthenticatedRequest,
    ) {
      if (!Array.isArray(body?.items) || body.items.length === 0) {
        throw new BadRequestException('items required');
      }

      return this.ordersService.createForBar(id, body, request.user);
    }

}

=======
}
>>>>>>> pr-22
