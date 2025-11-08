import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verify, type JwtPayload } from 'jsonwebtoken';
import { $Enums } from '@prisma/client';

import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class ApiAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = this.extractToken(request);

    // --- Dev bypass with API_DEV_TOKEN --------------------------------------
    if (process.env.NODE_ENV !== 'production' && authorization === process.env.API_DEV_TOKEN) {
      const role: $Enums.UserRole = 'staff';          // <- Prisma enum value (string literal)
      request.user = { sub: 'dev', role, barId: 'demo-bar' };
      return true;
    }

    // ── Real auth path (NextAuth JWT) ───────────────────────────────────────────
    if (!authorization) {
      throw new UnauthorizedException('Authorization header missing');
    }

    const secret = this.configService.get<string>('nextauth.secret');
    if (!secret) {
      throw new UnauthorizedException('Authentication is not configured');
    }

    try {
      const payload = verify(authorization, secret) as JwtPayload & Partial<AuthenticatedUser>;

      if (!payload.role || typeof payload.role !== 'string' || !payload.sub) {
        throw new UnauthorizedException('Token missing required claims');
      }

      // Coerce string role → Prisma enum
      const roleKey = payload.role as keyof typeof UserRole;
      const roleEnum = UserRole[roleKey];
      if (!roleEnum) {
        throw new UnauthorizedException('Invalid role in token');
      }

      // Attach the normalized user to the request
      request.user = {
        sub: String(payload.sub),
        email: payload.email,
        role: payload.role as $Enums.UserRole,       // ensure Prisma role type
        barId: (payload as any).barId ?? null,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  /**
   * Extracts a bearer token from the Authorization header.
   */
  private extractToken(request: AuthenticatedRequest): string | null {
    const header = request.headers['authorization'] ?? request.headers['Authorization'];
    if (!header) return null;
    if (Array.isArray(header)) return null;

    const [scheme, token] = header.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) return null;

    return token;
  }
}
