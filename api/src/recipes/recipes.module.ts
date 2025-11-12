import { Module } from '@nestjs/common';
<<<<<<< HEAD
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';

@Module({
  imports: [ConfigModule, HttpModule],
  controllers: [RecipesController],
  providers: [RecipesService]
=======
import { HttpModule } from '@nestjs/axios';
import { RecipesService } from './recipes.service';

@Module({
  imports: [HttpModule],
  providers: [RecipesService],
  exports: [RecipesService],
>>>>>>> pr-22
})
export class RecipesModule {}
