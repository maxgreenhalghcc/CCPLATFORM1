import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';

@Module({
  imports: [HttpModule],
  controllers: [QuizController],
  providers: [QuizService]
})
export class QuizModule {}
