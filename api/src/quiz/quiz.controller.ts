import { Body, Controller, Post } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

@Controller('quiz')
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @Post('sessions')
  createSession(@Body() dto: CreateSessionDto) {
    return this.quizService.createSession(dto);
  }

  @Post('submit')
  submit(@Body() dto: SubmitQuizDto) {
    return this.quizService.submit(dto);
  }
}
