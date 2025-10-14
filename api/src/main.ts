import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { json } from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log']
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true }
    })
  );

  app.enableCors({
    origin: true,
    credentials: true
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') ?? 4000;
  const globalPrefix = 'v1';

  app.setGlobalPrefix(globalPrefix, { exclude: ['health'] });
  app.use(json({ limit: '5mb' }));

  await app.listen(port);
  Logger.log(`🚀 API is running on http://localhost:${port}/${globalPrefix}`);
}

void bootstrap();
