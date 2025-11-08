import { $Enums } from '@prisma/client';
export type UserRole = $Enums.UserRole;
export interface AuthenticatedUser {
    sub: string;
    email?: string;
    role: UserRole;
    barId: string | null;
}
