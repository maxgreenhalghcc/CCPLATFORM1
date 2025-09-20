import { Type } from 'class-transformer';
import { IsArray, IsObject, IsString, ValidateNested } from 'class-validator';

class QuizAnswerValueDto {
  @IsString()
  choice!: string;
}

class QuizAnswerDto {
  @IsString()
  question_id!: string;

  @IsObject()
  @ValidateNested()
  @Type(() => QuizAnswerValueDto)
  value!: QuizAnswerValueDto;
}

export class SubmitQuizDto {
  @IsString()
  session_id!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers!: QuizAnswerDto[];
}

export { QuizAnswerDto, QuizAnswerValueDto };
