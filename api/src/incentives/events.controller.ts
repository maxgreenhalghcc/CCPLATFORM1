import { Body, Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { FunnelEventType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateFunnelEventDto } from './dto/create-funnel-event.dto';

@Controller('events')
export class EventsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  async createEvent(@Body() dto: CreateFunnelEventDto): Promise<void> {
    // Silently ignore unknown barIds — frontend quiz may fire before bar resolves
    const bar = await this.prisma.bar.findUnique({ where: { id: dto.barId } });
    if (!bar) return;

    // Only accept frontend-origin event types — server-side events are created internally
    const frontendTypes: FunnelEventType[] = [
      FunnelEventType.PAGE_LOAD,
      FunnelEventType.QUIZ_START,
      FunnelEventType.QUIZ_COMPLETE,
    ];

    if (!frontendTypes.includes(dto.eventType)) return;

    await this.prisma.funnelEvent.create({
      data: {
        barId: dto.barId,
        sessionId: dto.sessionId,
        eventType: dto.eventType,
        metadata: dto.metadata as Record<string, unknown> ?? undefined,
      },
    });
  }
}
