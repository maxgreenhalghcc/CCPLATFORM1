import { IsObject, IsOptional, IsString } from 'class-validator';

export class GenerateRecipeDto {
  @IsString()
  sessionId!: string;

  @IsString()
  barId!: string;

  @IsOptional()
  seed?: number;

  @IsOptional()
  @IsObject()
  quiz?: Record<string, unknown>;
}
