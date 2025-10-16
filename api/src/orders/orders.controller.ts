import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { DevAuthGuard } from '../common/guards/dev-auth.guard';
import { UpdateOrderStatusDto } from './dto/update-status.dto';

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

  @UseGuards(DevAuthGuard)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto.status);
  }
}
