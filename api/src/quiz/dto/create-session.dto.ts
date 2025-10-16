import { IsOptional, IsString } from 'class-validator';

export class CreateSessionDto {
  @IsOptional()
  @IsString()
  source?: string | null;
}
