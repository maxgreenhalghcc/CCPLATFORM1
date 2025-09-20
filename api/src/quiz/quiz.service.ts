import { Injectable } from '@nestjs/common';
import { CreateSessionDto } from './dto/create-session.dto';
import { RecordAnswerDto } from './dto/record-answer.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';

@Injectable()
export class QuizService {
  createSession(slug: string, dto: CreateSessionDto) {
    return {
      sessionId: `session_${Date.now()}`,
      barSlug: slug,
      source: dto.source ?? null
    };
  }

  recordAnswer(sessionId: string, dto: RecordAnswerDto) {
    return {
      status: 'recorded',
      sessionId,
      questionId: dto.questionId
    };
  }

  submit(sessionId: string, dto: SubmitQuizDto) {
    return {
      orderId: `order_${sessionId}`,
      final: dto.final ?? true
    };
  }
}
