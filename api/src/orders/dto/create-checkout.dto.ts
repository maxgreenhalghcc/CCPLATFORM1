import { IsString, IsUrl } from 'class-validator';

export class CreateCheckoutDto {
  @IsUrl()
  successUrl!: string;

  @IsUrl()
  cancelUrl!: string;

  @IsString()
  currency: string = 'gbp';
}
