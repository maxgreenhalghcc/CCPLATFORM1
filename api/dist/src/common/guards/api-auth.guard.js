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
exports.ApiAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jsonwebtoken_1 = require("jsonwebtoken");
let ApiAuthGuard = class ApiAuthGuard {
    constructor(configService) {
        this.configService = configService;
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const authorization = this.extractToken(request);
        const token = authorization?.trim();
        const bypass = (process.env.API_DEV_TOKEN || '').trim();
        if (process.env.NODE_ENV !== 'production' && token && token === bypass) {
            const requestedBar = request.params?.barId ??
                request.params?.id ??
                'demo-bar';
            request.user = {
                sub: 'dev',
                role: 'staff',
                barId: requestedBar,
            };
            return true;
        }
        if (!authorization) {
            throw new common_1.UnauthorizedException('Authorization header missing');
        }
        const secret = this.configService.get('nextauth.secret');
        if (!secret) {
            throw new common_1.UnauthorizedException('Authentication is not configured');
        }
        try {
            const payload = (0, jsonwebtoken_1.verify)(authorization, secret);
            if (!payload.role || typeof payload.role !== 'string' || !payload.sub) {
                throw new common_1.UnauthorizedException('Token missing required claims');
            }
            request.user = {
                sub: String(payload.sub),
                email: payload.email ?? null,
                role: payload.role,
                barId: payload.barId ?? null,
            };
            return true;
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid authentication token');
        }
    }
    extractToken(request) {
        const header = request.headers['authorization'] ?? request.headers['Authorization'];
        if (!header)
            return null;
        if (Array.isArray(header))
            return null;
        const [scheme, token] = header.split(' ');
        if (scheme?.toLowerCase() !== 'bearer' || !token)
            return null;
        return token;
    }
};
exports.ApiAuthGuard = ApiAuthGuard;
exports.ApiAuthGuard = ApiAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ApiAuthGuard);
//# sourceMappingURL=api-auth.guard.js.map