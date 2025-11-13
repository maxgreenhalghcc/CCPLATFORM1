"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const Sentry = require("@sentry/node");
const HEADER = 'x-request-id';
let LoggingInterceptor = class LoggingInterceptor {
    intercept(context, next) {
        const http = context.switchToHttp();
        const req = http.getRequest();
        const res = http.getResponse();
        const { method, url } = req;
        const userId = req?.user?.id ?? null;
        const requestId = req?.requestId ?? res?.getHeader?.(HEADER);
        const start = Date.now();
        if (req?.log && typeof req.log.child === 'function') {
            req.log = req.log.child({ requestId, userId });
        }
        if (process.env.SENTRY_DSN && requestId) {
            Sentry.configureScope((scope) => {
                scope.setTag('request_id', requestId);
                if (userId) {
                    scope.setUser({ id: userId });
                }
            });
        }
        return next.handle().pipe((0, operators_1.tap)({
            next: () => {
                const duration = Date.now() - start;
                const log = req?.log ?? console;
                if (typeof log.info === 'function') {
                    log.info({ requestId, userId, method, url, duration }, 'request completed');
                }
                else if (typeof log.log === 'function') {
                    log.log(`request completed ${method} ${url} ${duration}ms id=${requestId ?? 'n/a'} user=${userId ?? 'anonymous'}`);
                }
            }
        }));
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = __decorate([
    (0, common_1.Injectable)()
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map