import { IsBoolean, IsOptional } from 'class-validator';

export class SubmitQuizDto {
  @IsOptional()
  @IsBoolean()
  final?: boolean;
}
