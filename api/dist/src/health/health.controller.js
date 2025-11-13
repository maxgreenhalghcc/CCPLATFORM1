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
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const START_TIME = Date.now();
function resolveVersion() {
    return (process.env.npm_package_version ??
        process.env.APP_VERSION ??
        'unknown');
}
function resolveCommit() {
    return process.env.GIT_SHA ?? 'unknown';
}
function resolveUptimeSeconds() {
    return Math.round(process.uptime());
}
function sentryEnabled() {
    const candidates = [
        process.env.SENTRY_DSN,
        process.env.SENTRY_DSN_API,
        process.env.SENTRY_DSN_BACKEND,
    ];
    return candidates.some((value) => typeof value === 'string' && value.length > 0);
}
let HealthController = class HealthController {
    health() {
        return {
            status: 'ok',
            service: 'api',
            version: resolveVersion(),
            commit: resolveCommit(),
        };
    }
    status() {
        return {
            ok: true,
            service: 'api',
            version: resolveVersion(),
            commit: resolveCommit(),
            uptime: Math.round((Date.now() - START_TIME) / 1000) || resolveUptimeSeconds(),
            sentry: {
                enabled: sentryEnabled(),
            },
        };
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "health", null);
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HealthController.prototype, "status", null);
exports.HealthController = HealthController = __decorate([
    (0, common_1.Controller)()
], HealthController);
//# sourceMappingURL=health.controller.js.map