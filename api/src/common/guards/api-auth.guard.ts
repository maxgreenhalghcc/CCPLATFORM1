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
    // --- EMERGENCY DEV BYPASS (guaranteed) -------------------------
    if (process.env.NODE_ENV !== 'production' && process.env.FORCE_DEV_BYPASS === 'true') {
      const requestedBar =
        request.params?.barId ??
        request.params?.id ??
        request.params?.slug ??
        request.params?.barSlug ??
        'demo-bar';

      // pretend to be an admin on the requested bar
      request.user = {
        sub: 'dev',
        role: 'admin' as any,
        barId: requestedBar,
      };

      // normalize params so all downstream guards/controllers agree
      (request as any).params = {
        ...(request.params ?? {}),
        barId: requestedBar,
        id: requestedBar,
        slug: requestedBar,
        barSlug: requestedBar,
      };

      return true; // short-circuit auth in dev
    }
    // ---------------------------------------------------------------

    // ----- DEV BYPASS (API_DEV_TOKEN) -----
    const rawHeader =
      (request.headers?.authorization as string | undefined) ??
      (request.headers as any)?.Authorization;

    // extract token (plain token or "Bearer <token>")
    const token = this.extractBearer(rawHeader); // plain token, no "Bearer "
    // dev token value from env (trim whitespace)
    const devBypassToken = (process.env.API_DEV_TOKEN ?? '').trim();

    // Optional debug log (now declared after token/devBypassToken)
    // Use this to verify what token and env values are being seen by the guard
    // console.log('[DEV BYPASS DEBUG]', { token, devBypassToken, params: request.params });

    // HARD FORCE bypass: if you set FORCE_DEV_BYPASS=true in your .env, skip all checks
    if (process.env.NODE_ENV !== 'production' && process.env.FORCE_DEV_BYPASS === 'true') {
      const requestedBar =
        request.params?.barId ??
        request.params?.id ??
        request.params?.slug ??
        request.params?.barSlug ??
        'demo-bar';

      // satisfy downstream guards/controllers
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

    // Secondary dev bypass: if caller sends the API_DEV_TOKEN as the bearer token
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
        role: 'staff' as $Enums.UserRole,
        barId: requestedBar,
      };

      (request as any).params = {
        ...(request.params ?? {}),
        barId: requestedBar,
        id: requestedBar,
        slug: requestedBar,
        barSlug: requestedBar,
      };

      // console.log('[DEV TOKEN BYPASS ACTIVE]', { token, devBypassToken, requestedBar, params: request.params });
      return true; // short-circuit in dev bypass
    }

    // --------------------------------------

    if (!token) {
      throw new UnauthorizedException('Authorization header missing');
    }

    const secret = this.configService.get<string>('nextauth.secret');
    if (!secret) {
      throw new UnauthorizedException('Authentication is not configured');
    }

    try {
      const payload = verify(token, secret) as JwtPayload & Partial<AuthenticatedUser>;

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
  }

  private extractBearer(
    headerValue: string | string[] | undefined,
  ): string | null {
    if (!headerValue) return null;
    if (Array.isArray(headerValue)) return null;

    // Support both already-plain tokens and "Bearer <token>"
    const trimmed = headerValue.trim();
    if (/^bearer\s+/i.test(trimmed)) {
      const [, tok] = trimmed.split(/\s+/, 2);
      return tok?.trim() || null;
    }
    return trimmed || null;
  }
}
