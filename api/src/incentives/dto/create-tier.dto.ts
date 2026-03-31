import { IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateTierDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(1)
  threshold: number;

  @IsNumber()
  @Min(0)
  payoutAmount: number;

  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
