import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verify, JwtPayload } from 'jsonwebtoken';
import { UserRole } from '@prisma/client';

import { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class ApiAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = this.extractToken(request);

    // ── Dev bypass with API_DEV_TOKEN ────────────────────────────────────────────
    if (
      process.env.NODE_ENV !== 'production' &&
      authorization === process.env.API_DEV_TOKEN
    ) {
      // AuthenticatedUser uses `sub`, not `id`, and `role` must be a UserRole
      request.user = {
        sub: 'dev',
        role: UserRole.staff,
        barId: 'demo-bar',
      };
      return true;
    }

    // ── Real auth path (NextAuth JWT) ───────────────────────────────────────────
    if (!authorization) {
      throw new UnauthorizedException('Authorization header missing');
    }

    const secret = this.configService.get<string>('nextAuth.secret');
    if (!secret) {
      throw new UnauthorizedException('Authentication is not configured');
    }

    try {
      const payload = verify(authorization, secret) as JwtPayload & {
        // Claims we expect to be present on the NextAuth JWT
        email?: string;
        role?: string;
        barId?: string | null;
        sub?: string;
      };

      // Validate required claims
      if (!payload.sub || !payload.role || typeof payload.role !== 'string') {
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
        role: roleEnum,
        barId: payload.barId ?? null,
      } as AuthenticatedUser;

      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid authentication token');
    }
  }

  /**
   * Extracts a bearer token from the Authorization header.
   */
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
