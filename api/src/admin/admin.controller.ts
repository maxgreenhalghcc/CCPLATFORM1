import { Controller, Get, Query } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metrics/revenue')
  getRevenue(@Query('barId') barId?: string, @Query('range') range?: string) {
    return this.adminService.getRevenue(barId, range);
  }

  @Get('metrics/orders')
  getOrders(@Query('barId') barId?: string, @Query('range') range?: string) {
    return this.adminService.getOrders(barId, range);
  }

  @Get('metrics/ingredients')
  getIngredients(@Query('barId') barId?: string, @Query('range') range?: string) {
    return this.adminService.getIngredients(barId, range);
  }
}
