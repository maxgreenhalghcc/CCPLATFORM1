import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-status.dto';
import { ApiAuthGuard } from '../common/guards/api-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
<<<<<<< HEAD
import { UserRole } from '../common/roles/user-role.enum';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
=======
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { CreateOrderDto } from './dto/create-order.dto';
>>>>>>> pr-22

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post(':id/checkout')
  createCheckout(@Param('id') id: string, @Body() dto?: CreateCheckoutDto) {
    return this.ordersService.createCheckout(id, dto);
  }

  @Get(':id/recipe')
  getRecipe(@Param('id') id: string) {
    return this.ordersService.getRecipe(id);
  }

  @UseGuards(ApiAuthGuard, RolesGuard)
  @Roles(UserRole.admin, UserRole.staff)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @Req() request: AuthenticatedRequest
  ) {
    return this.ordersService.updateStatus(id, dto.status, request.user);
  }
<<<<<<< HEAD
=======

  // === Added for recipe integration ===
  @Post('/bars/:barId/orders')
  createForBar(@Param('barId') barId: string, @Body() dto: CreateOrderDto) {
    return this.ordersService.createForBar(barId, dto);
  }

  @Post('/orders/:id/checkout')
  checkout(@Param('id') id: string) {
    return this.ordersService.checkout(id);
  }
>>>>>>> pr-22
}
