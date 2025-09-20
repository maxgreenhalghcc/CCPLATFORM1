import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RecordAnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @IsOptional()
  value?: unknown;
}
