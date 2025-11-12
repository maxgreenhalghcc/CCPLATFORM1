import { $Enums } from '@prisma/client';

export type UserRole = $Enums.UserRole;

export interface AuthenticatedUser {
  sub: string;            // user id
  email?: string;
  role: UserRole;         // <- use Prisma's enum
  barId: string | null;
}

