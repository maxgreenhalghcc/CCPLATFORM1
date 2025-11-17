import { Module } from '@nestjs/common';
import { BarsController } from './bars.controller';
import { BarsService } from './bars.service';
import { BarQuizController } from './bar-quiz.controller';
import { BarQuizService } from './bar-quiz.service';
import { OrdersModule } from '../orders/orders.module';
import { RecipesModule } from '../recipes/recipes.module';

@Module({
  imports: [OrdersModule, RecipesModule],
  controllers: [BarsController, BarQuizController],
  providers: [BarsService, BarQuizService],
  exports: [BarsService],
})
export class BarsModule {}
