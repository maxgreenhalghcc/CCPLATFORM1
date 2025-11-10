import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

// ✅ type-only import for enum TYPES
import type { $Enums } from '@prisma/client';

import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
  if (process.env.NODE_ENV !== 'production' && process.env.FORCE_DEV_BYPASS === 'true') {
    return true; // bypass all role checks in local dev
  }
  }

  canActivate(ctx: ExecutionContext): boolean {
    // requiredRoles is a list of Prisma enum TYPES
    const requiredRoles =
      this.reflector.getAllAndOverride<$Enums.UserRole[]>(
        ROLES_KEY,
        [ctx.getHandler(), ctx.getClass()],
      );

    // no roles required -> allow
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = req.user;
    if (!user) return false;

    // user.role is already a $Enums.UserRole
    return requiredRoles.includes(user.role as $Enums.UserRole);
  }
}
