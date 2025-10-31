import { UserRole } from '@prisma/client';
export interface AuthenticatedUser {
    sub: string;
    email?: string;
    role: UserRole;
    barId?: string | null;
}
