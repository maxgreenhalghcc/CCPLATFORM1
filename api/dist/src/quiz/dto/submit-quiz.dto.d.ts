declare class QuizAnswerValueDto {
    choice: string;
}
declare class QuizAnswerDto {
    questionId: string;
    value: QuizAnswerValueDto;
}
export declare class SubmitQuizDto {
    contact?: string;
    final?: boolean;
    answers?: QuizAnswerDto[];
}
export { QuizAnswerDto, QuizAnswerValueDto };
