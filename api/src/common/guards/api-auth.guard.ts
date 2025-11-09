import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verify, type JwtPayload } from 'jsonwebtoken';

// type-only import so we can reference the Prisma enum type safely
import type { $Enums } from '@prisma/client';

import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class ApiAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = this.extractToken(request);

    // -------------------------------------------------- DEV BYPASS (API_DEV_TOKEN) -------------------------------
    const token = authorization?.trim();
    const bypass = (process.env.API_DEV_TOKEN || '').trim();
    // --- DEV BYPASS (debug) -
    // debug info (temporary)
    console.log('[DEV BYPASS DEBUG]', {
      NODE_ENV: process.env.NODE_ENV,
      hasBypass: bypass.length > 0,
      tokenPresent: !!token,
      tokenFirst8: (token ?? '').slice(0, 8),
      bypassFirst8: (bypass ?? '').slice(0, 8),
    });

    if (process.env.NODE_ENV !== 'production' && token && token === bypass) {
      const requestedBar =
        request.params?.barId ??
        request.params?.id ??
        'demo-bar';

      request.user = {
        sub: 'dev',
        role: 'staff' as $Enums.UserRole,
        barId: requestedBar,
      };
        // Ensure both param names exist so downstream guards/controllers agree:
        (request as any).params = {
          ...(request.params ?? {}),
          barId: requestedBar,
          id: requestedBar,
        };

      // Optional: temporary log for confirmation
      // console.log('[DEV BYPASS ACTIVE]', { token, bypass, requestedBar });
      return true;
    }
    // -----------------------------------------------------------------------

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

      // Build the request.user object the API expects
      request.user = {
        sub: String(payload.sub),
        email: (payload as any).email ?? null,
        role: (payload.role as unknown) as $Enums.UserRole, // cast string claim to Prisma enum type
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
    if (!header) return null;
    if (Array.isArray(header)) return null;

    const [scheme, token] = header.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) return null;

    return token;
    }
}
