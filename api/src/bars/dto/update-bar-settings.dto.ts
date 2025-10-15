import { IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateBarSettingsDto {
  @IsOptional()
  @IsString()
  introText?: string;

  @IsOptional()
  @IsString()
  outroText?: string;

  @IsOptional()
  @IsObject()
  theme?: Record<string, string>;

  @IsOptional()
  @IsNumber()
  pricingCents?: number;
}
