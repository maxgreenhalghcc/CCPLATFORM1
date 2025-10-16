import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [WebhooksController],
  providers: [WebhooksService]
})
export class WebhooksModule {}
