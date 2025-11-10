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
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedRequest>();

    // ---------------------- HARD DEV BYPASS (env switch) ----------------------
    // If you set FORCE_DEV_BYPASS=true in your .env (and you're not in production),
    // we short-circuit all auth and act as a staff user on the requested bar.
    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.FORCE_DEV_BYPASS === 'true'
    ) {
      const requestedBar =
        request.params?.barId ??
        request.params?.id ??
        request.params?.slug ??
        request.params?.barSlug ??
        'demo-bar';

      request.user = {
        sub: 'dev',
        role: 'staff' as $Enums.UserRole,
        barId: requestedBar,
      };

      // Ensure all common param names exist for downstream guards/controllers
      (request as any).params = {
        ...(request.params ?? {}),
        barId: requestedBar,
        id: requestedBar,
        slug: requestedBar,
        barSlug: requestedBar,
      };

      // console.log('[HARD DEV BYPASS ACTIVE]', { bar: requestedBar });
      return true; // IMPORTANT: exit early
    }
    // -------------------------------------------------------------------------

    // ----------------------------- Normal auth path ---------------------------
    // Extract header in a tolerant way (handles "Authorization" or "authorization")
    const rawHeader =
      (request.headers?.authorization as string | undefined) ??
      (request.headers as any)?.Authorization;

    const token = this.extractBearer(rawHeader); // supports "Bearer x" or plain token
    const devBypassToken = (process.env.API_DEV_TOKEN ?? '').trim();

    // Secondary dev bypass: send the API_DEV_TOKEN as the bearer token
    if (
      process.env.NODE_ENV !== 'production' &&
      token &&
      devBypassToken &&
      token === devBypassToken
    ) {
      const requestedBar =
        request.params?.barId ??
        request.params?.id ??
        request.params?.slug ??
        request.params?.barSlug ??
        'demo-bar';

      request.user = {
        sub: 'dev',
        role: 'admin' as $Enums.UserRole,
        barId: requestedBar,
      };

      (request as any).params = {
        ...(request.params ?? {}),
        barId: requestedBar,
        id: requestedBar,
        slug: requestedBar,
        barSlug: requestedBar,
      };

      console.log('[DEV TOKEN BYPASS ACTIVE]', { bar: requestedBar });
      return true; // short-circuit
    }

    if (!token) {
      throw new UnauthorizedException('Authorization header missing');
    }

    const secret = this.configService.get<string>('nextauth.secret');
    if (!secret) {
      throw new UnauthorizedException('Authentication is not configured');
    }

    // Validate NextAuth/JWT and attach user info
    try {
      const payload = verify(token, secret) as JwtPayload &
        Partial<AuthenticatedUser>;

      if (!payload.role || typeof payload.role !== 'string' || !payload.sub) {
        throw new UnauthorizedException('Token missing required claims');
      }

      request.user = {
        sub: String(payload.sub),
        email: (payload as any).email ?? null,
        role: (payload.role as unknown) as $Enums.UserRole,
        barId: (payload as any).barId ?? null,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid authentication token');
    }
    // -------------------------------------------------------------------------
  }

  /**
   * Returns a token from an Authorization header value.
   * - Accepts "Bearer <token>" or already-plain "<token>"
   */
  private extractBearer(
    headerValue: string | string[] | undefined,
  ): string | null {
    if (!headerValue) return null;
    if (Array.isArray(headerValue)) return null;

    const trimmed = headerValue.trim();
    if (/^bearer\s+/i.test(trimmed)) {
      const [, tok] = trimmed.split(/\s+/, 2);
      return tok?.trim() || null;
    }
    return trimmed || null;
  }
}
