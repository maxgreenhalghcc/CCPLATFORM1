import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// type-only import so we reference enum *types* without pulling runtime code
import type { $Enums } from '@prisma/client';

import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * Single canActivate method:
   * - Optional local-dev bypass with FORCE_DEV_BYPASS=true
   * - Reads required roles from @Roles() decorator via Reflector
   * - Allows when no roles are specified
   * - Verifies req.user exists and has one of the required roles
   */
  canActivate(context: ExecutionContext): boolean {
    // Hard bypass for local development
    if (
      process.env.NODE_ENV !== 'production' &&
      process.env.FORCE_DEV_BYPASS === 'true'
    ) {
      return true;
    }

    // Required roles are Prisma enum *types*
    const requiredRoles =
      this.reflector.getAllAndOverride<$Enums.UserRole[]>(
        ROLES_KEY,
        [context.getHandler(), context.getClass()],
      );

    // If the route/controller didn't specify roles, allow
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = req.user;
    if (!user) return false;

    // user.role should already match $Enums.UserRole; cast to satisfy TS
    return requiredRoles.includes(user.role as $Enums.UserRole);
  }
}
