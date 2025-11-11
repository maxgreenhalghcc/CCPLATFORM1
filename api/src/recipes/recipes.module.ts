import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { RecipesService } from './recipes.service';

@Module({
  imports: [HttpModule],
  providers: [RecipesService],
  exports: [RecipesService],
})
export class RecipesModule {}
