import { UserRole } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      role: UserRole;
      barId?: string | null;
    };
    apiToken?: string;
  }

  interface User {
    id: string;
    email: string;
    role: UserRole;
    barId?: string | null;
    emailVerified?: Date | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: UserRole;
    barId?: string | null;
    email?: string;
  }
}
