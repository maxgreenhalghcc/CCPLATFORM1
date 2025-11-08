import { UserRole } from '@prisma/client';
export interface AuthenticatedUser {
    sub: string;
    role: UserRole;
    barId: string | null;
}
