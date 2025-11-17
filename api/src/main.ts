import rateLimit from 'express-rate-limit';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { json, raw } from 'express';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { AppModule } from './app.module';

const SENTRY_DSN =
  process.env.SENTRY_DSN ?? process.env.SENTRY_DSN_API ?? process.env.SENTRY_DSN_BACKEND ?? '';
const SENTRY_TRACES_SAMPLE_RATE = Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1');
const SENTRY_PROFILES_SAMPLE_RATE = Number(process.env.SENTRY_PROFILES_SAMPLE_RATE ?? '0');

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'production',
    tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
    profilesSampleRate: SENTRY_PROFILES_SAMPLE_RATE,
    integrations: [
      // FIX(build): align with supported Sentry node integrations for tracing.
      new Sentry.Integrations.Http({ tracing: true }),
      nodeProfilingIntegration(),
    ],
    beforeSend(event) {
      if (event.request) {
        if (event.request.data) {
          event.request.data = '[redacted]';
        }
        if (event.request.headers) {
          const scrubbed = { ...event.request.headers };
          delete scrubbed.authorization;
          delete scrubbed.cookie;
          delete scrubbed['x-staff-token'];
          delete scrubbed['x-api-token'];
          event.request.headers = scrubbed;
        }
      }
      return event;
    },
  });
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  const logger = app.get(Logger);
  app.useLogger(logger);

  const httpAdapter = app.getHttpAdapter().getInstance();
  if (SENTRY_DSN) {
    httpAdapter.use(Sentry.Handlers.requestHandler());
    httpAdapter.use(Sentry.Handlers.tracingHandler());
  }

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

  app.setGlobalPrefix(globalPrefix);
  app.use(`/${globalPrefix}/webhooks/stripe`, raw({ type: 'application/json' }));
  app.use(json({ limit: '5mb' }));

  if (SENTRY_DSN) {
    httpAdapter.use(Sentry.Handlers.errorHandler());
  }

  await app.listen(port);
  // FIX(build): use Nest logger.log for compatibility with Logger interface.
  logger.log(`🚀 API is running on http://localhost:${port}/${globalPrefix}`);
}

void bootstrap();
