export declare class QuizCustomerDto {
    name: string;
    email?: string;
    phone?: string;
}
export declare class QuizAnswersDto {
    season: string;
    house: string;
    taste: string;
    music: string;
    scent: string;
    base: string;
    afterMeal: string;
    colour: string;
    sweetness: string;
}
export declare class QuizSubmitDto {
    customer: QuizCustomerDto;
    answers: QuizAnswersDto;
    notes?: string;
}
export type QuizAnswers = QuizAnswersDto;
