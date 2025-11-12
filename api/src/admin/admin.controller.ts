import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import type {
  OrdersMetricsResponse,
  RevenueMetricsResponse,
} from './admin.service';
import { ApiAuthGuard } from '../common/guards/api-auth.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UserRole } from '../common/roles/user-role.enum';

@UseGuards(ApiAuthGuard, RolesGuard)
@Roles(UserRole.admin)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('metrics/revenue')
  getRevenue(
    @Query('barId') barId?: string,
    @Query('range') range?: string,
  ): Promise<RevenueMetricsResponse> {
    return this.adminService.getRevenue(barId, range);
  }

  @Get('metrics/orders')
  getOrders(
    @Query('barId') barId?: string,
    @Query('range') range?: string,
  ): Promise<OrdersMetricsResponse> {
    return this.adminService.getOrders(barId, range);
  }

  @Get('metrics/ingredients')
  getIngredients(@Query('barId') barId?: string, @Query('range') range?: string) {
    return this.adminService.getIngredients(barId, range);
  }
}
