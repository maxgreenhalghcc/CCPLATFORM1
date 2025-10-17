import rateLimit from 'express-rate-limit';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { json, raw } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(Logger);
  app.useLogger(logger);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  const configService = app.get(ConfigService);
  const windowMs = configService.get<number>('rateLimit.windowMs') ?? 60000;
  const max = configService.get<number>('rateLimit.max') ?? 120;
  app.use(
    rateLimit({
      windowMs,
      max,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  const corsOrigins = configService.get<string[]>('cors.origins') ?? [];
  app.enableCors({
    origin: corsOrigins.length === 0 ? true : corsOrigins,
    credentials: true,
  });

  const port = configService.get<number>('port') ?? 4000;
  const globalPrefix = 'v1';

  app.setGlobalPrefix(globalPrefix, { exclude: ['health'] });
  app.use(`/${globalPrefix}/webhooks/stripe`, raw({ type: 'application/json' }));
  app.use(json({ limit: '5mb' }));

  await app.listen(port);
  logger.info(`🚀 API is running on http://localhost:${port}/${globalPrefix}`);
}

void bootstrap();
