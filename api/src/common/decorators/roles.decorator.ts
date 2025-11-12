import { SetMetadata } from '@nestjs/common';
<<<<<<< HEAD
import { UserRole } from '../roles/user-role.enum';
=======
import { UserRole } from '@prisma/client';
>>>>>>> pr-22

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
