import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Prisma } from '@prisma/client';

import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    // Expect metadata as array of Prisma.UserRole enum values
    const requiredRoles = this.reflector.getAllAndOverride<Prisma.UserRole[]>(
      ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const req = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = req.user;
    if (!user) return false;

    // user.role is (or is castable to) Prisma.UserRole
    return requiredRoles.includes(user.role as Prisma.UserRole);
  }
}
