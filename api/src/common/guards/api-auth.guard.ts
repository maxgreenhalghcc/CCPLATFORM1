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

    // ---------------------- DEV BYPASS (API_DEV_TOKEN) ----------------------
    if (
      process.env.NODE_ENV !== 'production' &&
      authorization === process.env.API_DEV_TOKEN
    ) {
      // pick up the bar id from common param names, or fall back to demo
      const requestedBar =
        request.params?.barId ??
        request.params?.id ??
        'demo-bar';

      // role is the Prisma enum (type-only) – the string value is 'staff'
      const role = 'staff' as $Enums.UserRole;

      request.user = {
        sub: 'dev',
        role,
        barId: requestedBar,
      };

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
