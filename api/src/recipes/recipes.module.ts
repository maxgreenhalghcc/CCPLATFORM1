import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';

@Module({
  imports: [ConfigModule, HttpModule],
  controllers: [RecipesController],
  providers: [RecipesService]
})
export class RecipesModule {}
