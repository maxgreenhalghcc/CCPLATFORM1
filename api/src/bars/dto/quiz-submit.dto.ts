import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';

export class QuizCustomerDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class QuizAnswersDto {
  @IsString()
  @IsNotEmpty()
  season!: string;

  @IsString()
  @IsNotEmpty()
  house!: string;

  @IsString()
  @IsNotEmpty()
  taste!: string;

  @IsString()
  @IsNotEmpty()
  music!: string;

  @IsString()
  @IsNotEmpty()
  scent!: string;

  @IsString()
  @IsNotEmpty()
  base!: string;

  @IsString()
  @IsNotEmpty()
  afterMeal!: string;

  @IsString()
  @IsNotEmpty()
  colour!: string;

  @IsString()
  @IsNotEmpty()
  sweetness!: string;
}

export class QuizSubmitDto {
  @ValidateNested()
  @Type(() => QuizCustomerDto)
  customer!: QuizCustomerDto;

  @ValidateNested()
  @Type(() => QuizAnswersDto)
  answers!: QuizAnswersDto;

  @IsOptional()
  @IsString()
  notes?: string;
}

export type QuizAnswers = QuizAnswersDto;
