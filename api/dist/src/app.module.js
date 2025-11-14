"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const nestjs_pino_1 = require("nestjs-pino");
const Sentry = require("@sentry/node");
const configuration_1 = require("./config/configuration");
const validation_1 = require("./config/validation");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const bars_module_1 = require("./bars/bars.module");
const quiz_module_1 = require("./quiz/quiz.module");
const orders_module_1 = require("./orders/orders.module");
const admin_module_1 = require("./admin/admin.module");
const webhooks_module_1 = require("./webhooks/webhooks.module");
const health_module_1 = require("./health/health.module");
const request_id_middleware_1 = require("./common/middleware/request-id.middleware");
const logging_interceptor_1 = require("./common/interceptors/logging.interceptor");
const HEADER = 'x-request-id';
let SentryFilter = class SentryFilter extends core_1.BaseExceptionFilter {
    constructor(adapterHost) {
        super(adapterHost.httpAdapter);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const req = ctx.getRequest();
        const res = ctx.getResponse();
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
};
SentryFilter = __decorate([
    (0, common_1.Catch)(),
    __metadata("design:paramtypes", [core_1.HttpAdapterHost])
], SentryFilter);
let AppModule = class AppModule {
    configure(consumer) {
        consumer.apply(request_id_middleware_1.RequestIdMiddleware).forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                load: [configuration_1.default],
                validationSchema: validation_1.validationSchema,
            }),
            nestjs_pino_1.LoggerModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => {
                    const nodeEnv = configService.get('nodeEnv');
                    const level = configService.get('logLevel') ?? 'info';
                    return {
                        pinoHttp: {
                            level,
                            customProps: (req, _res) => ({
                                requestId: req?.requestId,
                                userId: req?.user?.id ?? null,
                            }),
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
                            transport: nodeEnv === 'development'
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
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            bars_module_1.BarsModule,
            quiz_module_1.QuizModule,
            orders_module_1.OrdersModule,
            admin_module_1.AdminModule,
            webhooks_module_1.WebhooksModule,
            health_module_1.HealthModule,
        ],
        providers: [
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: logging_interceptor_1.LoggingInterceptor,
            },
            {
                provide: core_1.APP_FILTER,
                useClass: SentryFilter,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map