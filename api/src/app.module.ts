import { Params, LoggerModule } from 'nestjs-pino';
import { IncomingMessage, ServerResponse } from 'http';
import { Params, LoggerModule } from 'nestjs-pino';
import { IncomingMessage, ServerResponse } from 'http';
import { MiddlewareConsumer, Module, NestModule, Catch, ArgumentsHost } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import * as Sentry from '@sentry/node';
import configuration from './config/configuration';
import { validationSchema } from './config/validation';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { BarsModule } from './bars/bars.module';
import { QuizModule } from './quiz/quiz.module';
import { OrdersModule } from './orders/orders.module';
import { RecipesModule } from './recipes/recipes.module';
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
    const req: any = ctx.getRequest();
    const res: any = ctx.getResponse();
    const requestId = req?.requestId ?? res?.getHeader?.(HEADER);

    if (process.env.SENTRY_DSN) {
      Sentry.withScope((scope) => {
        if (requestId) {
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
    const level = configService.get<string>('logLevel') ?? 'info';
    return {
      pinoHttp: {
        level,
        // pretty printing in dev; keep or remove as you like
        transport: { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } },
        // Note the correct parameter types here:
        customProps: (_req: IncomingMessage, _res: ServerResponse) => ({
          requestId: (_req as any)?.requestId,
          userId: (_req as any)?.user?.id ?? null,
        }),
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.headers.x-staff-token',
            'req.headers["x-staff-token"]',
            'req.headers["x-api-token"]',
            'res.headers["set-cookie"]',
          ],
          censor: '[redacted]',
        },
      },
    };
  },
}),

    PrismaModule,
    AuthModule,
    BarsModule,
    QuizModule,
    OrdersModule,
    RecipesModule,
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
