import type { Request } from 'express';
import { BarQuizService } from './bar-quiz.service';
import { QuizSubmitDto } from './dto/quiz-submit.dto';
export declare class BarQuizController {
    private readonly barQuizService;
    constructor(barQuizService: BarQuizService);
    getSkin(slug: string): Promise<unknown>;
    submit(slug: string, dto: QuizSubmitDto, request: Request): Promise<unknown>;
}
