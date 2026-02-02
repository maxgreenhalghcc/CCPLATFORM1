import {
  MiddlewareConsumer,
  Module,
  NestModule,
  Catch,
  ArgumentsHost,
} from '@nestjs/common';
import {
  APP_FILTER,
  APP_INTERCEPTOR,
  BaseExceptionFilter,
  HttpAdapterHost,
} from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { IncomingMessage, ServerResponse } from 'http';
import { LoggerModule } from 'nestjs-pino';
import type { Params } from 'nestjs-pino';
import * as Sentry from '@sentry/node';

import configuration from './config/configuration';
import { validationSchema } from './config/validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { BarsModule } from './bars/bars.module';
import { QuizModule } from './quiz/quiz.module';
import { OrdersModule } from './orders/orders.module';
import { AdminModule } from './admin/admin.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { HealthModule } from './health/health.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

const HEADER = 'x-request-id';

@Catch()
class SentryFilter extends BaseExceptionFilter {
  constructor(adapterHost: HttpAdapterHost) {
    super(adapterHost.httpAdapter);
  }

  override catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request & { requestId?: string; user?: { id?: string } }>();
    const res = ctx.getResponse<Response>();
    const requestId =
      (req as unknown as { requestId?: string })?.requestId ??
      (res as unknown as { getHeader?: (header: string) => unknown })?.getHeader?.(HEADER);

    if (process.env.SENTRY_DSN) {
      Sentry.withScope((scope) => {
        if (typeof requestId === 'string' && requestId) {
          scope.setTag('request_id', requestId);
        }
        scope.setContext('request', {
          method: req?.method,
          url: req?.url,
        });
        Sentry.captureException(exception);
      });
    }

    super.catch(exception, host);
  }
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): Params => {
        const nodeEnv = configService.get<string>('nodeEnv');
        const level = configService.get<string>('logLevel') ?? 'info';

        return {
          pinoHttp: {
            level,
            // Signature (req, res) matches nestjs-pino expectations
            customProps: (
              req: IncomingMessage & { requestId?: string; user?: { id?: string } },
              res: ServerResponse<IncomingMessage>
            ) => {
              void res;
              return {
                requestId: req.requestId,
                userId: req.user?.id ?? null,
              };
            },
            redact: {
              paths: [
                'req.headers.authorization',
                'req.headers.cookie',
                'req.headers["x-staff-token"]',
                'req.headers["x-api-token"]',
                'res.headers["set-cookie"]',
                'req.body.contact',
                'req.body.answers',
                'user.email',
                'req.user.email',
              ],
              censor: '[redacted]',
            },
            transport:
              nodeEnv === 'development'
                ? {
                    target: 'pino-pretty',
                    options: {
                      translateTime: 'SYS:standard',
                      colorize: true,
                    },
                  }
                : undefined,
          },
        };
      },
    }),
    PrismaModule,
    AuthModule,
    BarsModule,
    QuizModule,
    OrdersModule,
    AdminModule,
    WebhooksModule,
    HealthModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: SentryFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}

