import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { BarOrdersController } from './bar-orders.controller';
import { OrdersService } from './orders.service';
import { ApiAuthGuard } from '../common/guards/api-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { RecipesModule } from '../recipes/recipes.module';

@Module({
  imports: [RecipesModule],
  controllers: [OrdersController, BarOrdersController],
  providers: [OrdersService, ApiAuthGuard, RolesGuard],
  exports: [OrdersService]
})
export class OrdersModule {}
