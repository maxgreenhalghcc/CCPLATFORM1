import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested
} from 'class-validator';

class QuizAnswerValueDto {
  @IsString()
  choice!: string;
}

class QuizAnswerDto {
  @IsString()
  questionId!: string;

  @IsObject()
  @ValidateNested()
  @Type(() => QuizAnswerValueDto)
  value!: QuizAnswerValueDto;
}

export class SubmitQuizDto {
  @IsOptional()
  @IsBoolean()
  final?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers?: QuizAnswerDto[];
}

export { QuizAnswerDto, QuizAnswerValueDto };
