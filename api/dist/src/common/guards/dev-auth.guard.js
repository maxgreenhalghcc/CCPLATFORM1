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
exports.DevAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let DevAuthGuard = class DevAuthGuard {
    constructor(configService) {
        this.configService = configService;
    }
    canActivate(context) {
        const enabled = this.configService.get('authGuard.enabled');
        if (!enabled) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const headerName = this.configService.get('authGuard.header') ?? 'x-staff-token';
        const expectedToken = this.configService.get('authGuard.token') ?? '';
        if (!expectedToken) {
            throw new common_1.UnauthorizedException('Guard token is not configured');
        }
        const providedHeader = request.headers[String(headerName).toLowerCase()];
        const providedToken = Array.isArray(providedHeader) ? providedHeader[0] : providedHeader;
        if (typeof providedToken !== 'string' || providedToken !== expectedToken) {
            throw new common_1.UnauthorizedException('Missing or invalid auth token');
        }
        return true;
    }
};
exports.DevAuthGuard = DevAuthGuard;
exports.DevAuthGuard = DevAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], DevAuthGuard);
//# sourceMappingURL=dev-auth.guard.js.map