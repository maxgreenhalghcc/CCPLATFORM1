import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { BarQuizService } from './bar-quiz.service';
import { QuizSubmitDto } from './dto/quiz-submit.dto';

@Controller('bars/:slug/quiz')
export class BarQuizController {
  constructor(private readonly barQuizService: BarQuizService) {}

  @Get('skin')
  getSkin(@Param('slug') slug: string) {
    return this.barQuizService.getSkin(slug);
  }

  @Post('submit')
  submit(@Param('slug') slug: string, @Body() dto: QuizSubmitDto, @Req() request: Request) {
    const requestId = (request as any)?.requestId as string | undefined;
    return this.barQuizService.submit(slug, dto, requestId);
  }
}
