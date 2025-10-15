import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';

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
}
