import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('orders/:id/checkout')
  createCheckout(@Param('id') id: string, @Body() dto: CreateCheckoutDto) {
    return this.ordersService.createCheckout(id, dto);
  }

  @Get('orders/:id/recipe')
  getRecipe(@Param('id') id: string) {
    return this.ordersService.getRecipe(id);
  }

  @Get('bars/:id/orders')
  listOrders(@Param('id') id: string, @Query('status') status?: string) {
    return this.ordersService.listOrders(id, status);
  }
}
