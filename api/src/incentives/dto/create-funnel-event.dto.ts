import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';
import { FunnelEventType } from '@prisma/client';

export class CreateFunnelEventDto {
  @IsString()
  @IsNotEmpty()
  barId: string;

  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsEnum(FunnelEventType)
  eventType: FunnelEventType;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, unknown>;
}
