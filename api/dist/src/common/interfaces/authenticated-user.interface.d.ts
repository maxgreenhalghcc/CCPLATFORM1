import { UserRole } from '../roles/user-role.enum';
export interface AuthenticatedUser {
    sub: string;
    email?: string;
    role: UserRole;
    barId?: string | null;
}
