import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { RecipesService } from './recipes.service';
import { RecipesClient } from './recipes.client';

@Module({
  imports: [HttpModule],
  providers: [RecipesService, RecipesClient],
  exports: [RecipesService, RecipesClient],
})
export class RecipesModule {}
