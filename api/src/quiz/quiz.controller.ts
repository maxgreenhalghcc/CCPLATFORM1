import { Body, Controller, Param, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { QuizService } from './quiz.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { RecordAnswerDto } from './dto/record-answer.dto';

@Controller()
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post('bars/:slug/quiz/sessions')
  createSession(@Param('slug') slug: string, @Body() dto: CreateSessionDto) {
    return this.quizService.createSession(slug, dto);
  }

  @Post('quiz/sessions/:id/answers')
  recordAnswer(@Param('id') sessionId: string, @Body() dto: RecordAnswerDto) {
    return this.quizService.recordAnswer(sessionId, dto);
  }

  @Post('quiz/sessions/:id/submit')
  submit(@Param('id') sessionId: string, @Body() dto: SubmitQuizDto, @Req() req: Request) {
    const requestId = (req as any)?.requestId as string | undefined;
    return this.quizService.submit(sessionId, dto, requestId);
  }
}
