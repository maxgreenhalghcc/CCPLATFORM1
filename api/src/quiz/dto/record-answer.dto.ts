import { Type } from 'class-transformer';
import { IsNotEmpty, IsObject, IsOptional, IsString, ValidateNested } from 'class-validator';

class RecordAnswerValueDto {
  @IsString()
  choice!: string;
}

export class RecordAnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => RecordAnswerValueDto)
  value?: RecordAnswerValueDto;
}

export { RecordAnswerValueDto };
