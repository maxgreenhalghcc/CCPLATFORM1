import { Request } from 'express';
import { QuizService } from './quiz.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { RecordAnswerDto } from './dto/record-answer.dto';
export declare class QuizController {
    private readonly quizService;
    constructor(quizService: QuizService);
    createSession(slug: string, dto: CreateSessionDto): Promise<{
        sessionId: string;
    }>;
    recordAnswer(sessionId: string, dto: RecordAnswerDto): Promise<{
        status: string;
    }>;
    submit(sessionId: string, dto: SubmitQuizDto, req: Request): Promise<{
        orderId: string;
    }>;
}
