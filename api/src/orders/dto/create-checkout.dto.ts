import { IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateCheckoutDto {
  @IsOptional()
  @IsUrl()
  successUrl?: string;

  @IsOptional()
  @IsUrl()
  cancelUrl?: string;

  @IsOptional()
  @IsString()
  currency?: string;
}
