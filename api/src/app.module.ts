import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const nodeEnv = configService.get<string>('nodeEnv');
        const level = configService.get<string>('logLevel') ?? 'info';
        return {
          pinoHttp: {
            level,
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
    RecipesModule,
    AdminModule,
    WebhooksModule,
    HealthModule,
  ],
})
export class AppModule {}
