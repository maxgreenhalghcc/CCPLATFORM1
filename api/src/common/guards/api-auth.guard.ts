import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verify, type JwtPayload } from 'jsonwebtoken';

// ✅ Prisma value namespace for enum VALUES (e.g. Prisma.UserRole.staff)
import { Prisma } from '@prisma/client';
// ✅ Prisma type-only namespace for enum TYPES (e.g. $Enums.UserRole)
import type { $Enums } from '@prisma/client';

import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class ApiAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = this.extractToken(request);

    // ── Dev bypass with API_DEV_TOKEN ─────────────────────────────────────────
    if (
      process.env.NODE_ENV !== 'production' &&
      authorization === process.env.API_DEV_TOKEN
    ) {
      // use VALUE from Prisma namespace and TYPE from $Enums
      const role: $Enums.UserRole = Prisma.UserRole.staff;

      // try common param names for the bar identifier
      const requestedBar =
        request.params?.barId ??
        request.params?.id ??
        request.query?.barId ??
        'demo-bar';

      request.user = {
        sub: 'dev',
        role,
        barId: requestedBar,
      };

      return true;
    }
    // ─────────────────────────────────────────────────────────────────────────

    if (!authorization) {
      throw new UnauthorizedException('Authorization header missing');
    }

    const secret = this.configService.get<string>('nextauth.secret');
    if (!secret) {
      throw new UnauthorizedException('Authentication is not configured');
    }

    try {
      const payload = verify(authorization, secret) as JwtPayload &
        Partial<AuthenticatedUser>;

      if (!payload.role || typeof payload.role !== 'string' || !payload.sub) {
        throw new UnauthorizedException('Token missing required claims');
      }

      request.user = {
        sub: String(payload.sub),
        email: (payload as any).email ?? null,
        // cast the string claim to the Prisma enum TYPE
        role: payload.role as $Enums.UserRole,
        barId: (payload as any).barId ?? null,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  private extractToken(request: AuthenticatedRequest): string | null {
    const header =
      request.headers['authorization'] ?? request.headers['Authorization'];
    if (!header || Array.isArray(header)) return null;

    const [scheme, token] = header.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) return null;

    return token;
    }
}
