import {
  IsArray,
  IsEmail,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

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
  @IsNumber({ maxDecimalPlaces: 2 })
  pricingPounds?: number;

  @IsOptional()
  @IsString()
  contactName?: string;

  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @IsOptional()
  @IsString()
  contactPhone?: string;

  @IsOptional()
  @IsObject()
  address?: Record<string, string>;

  @IsOptional()
  @IsObject()
  openingHours?: Record<string, string>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  stock?: string[];

  @IsOptional()
  @IsUrl()
  stockListUrl?: string;

  @IsOptional()
  @IsObject()
  bankDetails?: Record<string, string>;

  @IsOptional()
  @IsString()
  stripeConnectId?: string;

  @IsOptional()
  @IsUrl()
  stripeConnectLink?: string;

  @IsOptional()
  @IsObject()
  brandPalette?: Record<string, string>;

  @IsOptional()
  @IsUrl()
  logoUrl?: string;
}
