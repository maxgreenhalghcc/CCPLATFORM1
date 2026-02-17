import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { OrdersService } from './orders.service';
import { CreateCheckoutDto } from './dto/create-checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-status.dto';
import { ApiAuthGuard } from '../common/guards/api-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

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

  @Post(':id/contact')
  async saveContact(
    @Param('id') id: string,
    @Body() body: { contact: string },
  ) {
    const contact = body.contact?.trim();
    if (!contact) {
      return { statusCode: 400, message: 'Missing contact' };
    }
    await this.ordersService.saveContact(id, contact);
    return { ok: true };
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

}
