import { UserRole } from '@prisma/client';

export interface AuthenticatedUser {
  sub: string;
  role: UserRole;        // <- must be Prisma enum, not a string union
  barId: string | null;  // or whatever your type is
}

