"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_rate_limit_1 = require("express-rate-limit");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const nestjs_pino_1 = require("nestjs-pino");
const express_1 = require("express");
const Sentry = require("@sentry/node");
const profiling_node_1 = require("@sentry/profiling-node");
const app_module_1 = require("./app.module");
const SENTRY_DSN = process.env.SENTRY_DSN ?? process.env.SENTRY_DSN_API ?? process.env.SENTRY_DSN_BACKEND ?? '';
const SENTRY_TRACES_SAMPLE_RATE = Number(process.env.SENTRY_TRACES_SAMPLE_RATE ?? '0.1');
const SENTRY_PROFILES_SAMPLE_RATE = Number(process.env.SENTRY_PROFILES_SAMPLE_RATE ?? '0');
if (SENTRY_DSN) {
    Sentry.init({
        dsn: SENTRY_DSN,
        environment: process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? 'production',
        tracesSampleRate: SENTRY_TRACES_SAMPLE_RATE,
        profilesSampleRate: SENTRY_PROFILES_SAMPLE_RATE,
        integrations: [
            new Sentry.Integrations.Http({ tracing: true }),
            (0, profiling_node_1.nodeProfilingIntegration)(),
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
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        bufferLogs: true,
    });
    const logger = app.get(nestjs_pino_1.Logger);
    app.useLogger(logger);
    const httpAdapter = app.getHttpAdapter().getInstance();
    if (SENTRY_DSN) {
        httpAdapter.use(Sentry.Handlers.requestHandler());
        httpAdapter.use(Sentry.Handlers.tracingHandler());
    }
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    const configService = app.get(config_1.ConfigService);
    const windowMs = configService.get('rateLimit.windowMs') ?? 60000;
    const max = configService.get('rateLimit.max') ?? 120;
    app.use((0, express_rate_limit_1.default)({
        windowMs,
        max,
        standardHeaders: true,
        legacyHeaders: false,
    }));
    const corsOrigins = configService.get('cors.origins') ?? [];
    app.enableCors({
        origin: corsOrigins.length === 0 ? true : corsOrigins,
        credentials: true,
    });
    const port = configService.get('port') ?? 4000;
    const globalPrefix = 'v1';
    app.setGlobalPrefix(globalPrefix);
    app.use(`/${globalPrefix}/webhooks/stripe`, (0, express_1.raw)({ type: 'application/json' }));
    app.use((0, express_1.json)({ limit: '5mb' }));
    if (SENTRY_DSN) {
        httpAdapter.use(Sentry.Handlers.errorHandler());
    }
    await app.listen(port);
    logger.log(`🚀 API is running on http://localhost:${port}/${globalPrefix}`);
}
void bootstrap();
//# sourceMappingURL=main.js.map