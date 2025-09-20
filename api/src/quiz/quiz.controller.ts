import { Body, Controller, Param, Post } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { RecordAnswerDto } from './dto/record-answer.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

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
  submit(@Param('id') sessionId: string, @Body() dto: SubmitQuizDto) {
    return this.quizService.submit(sessionId, dto);
  }
}
