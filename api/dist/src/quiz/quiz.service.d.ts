import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { RecordAnswerDto } from './dto/record-answer.dto';
export declare class QuizService {
    private readonly prisma;
    private readonly httpService;
    private readonly configService;
    private readonly logger;
    constructor(prisma: PrismaService, httpService: HttpService, configService: ConfigService);
    createSession(slug: string, _dto: CreateSessionDto): Promise<{
        sessionId: string;
    }>;
    recordAnswer(sessionId: string, dto: RecordAnswerDto): Promise<{
        status: string;
    }>;
    submit(sessionId: string, dto: SubmitQuizDto, requestId?: string): Promise<{
        orderId: string;
    }>;
    private normalizeAnswerValue;
    private normalizeStoredAnswer;
    private mergeAnswerRecord;
    private persistAnswers;
    private loadIngredientWhitelist;
    private requestRecipe;
}
