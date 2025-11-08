import type { PrismaClient } from "@prisma/client";
import { PrismaAdapter } from "@next-auth/prisma-adapter";

// Minimal user fields we actually need at sign-in/session time.
// (No `apiToken` here.)
const userSelect = {
  id: true,
  email: true,
  emailVerified: true,
  name: true,
  image: true,
  // If your schema has these, it's safe to include:
  // @ts-expect-error project-specific
  role: true,
  // @ts-expect-error project-specific
  barId: true,
};

export function SafePrismaAdapter(prisma: PrismaClient) {
  const base = PrismaAdapter(prisma);

  return {
    ...base,

    // Some codebases customize this to include extra fields. Force a safe select.
    async getUserByEmail(email: string) {
      return prisma.user.findUnique({
        where: { email },
        select: userSelect as any,
      }) as any;
    },

    // If your codebase customized session lookup to include extra fields,
    // make sure the nested user select is safe too.
    async getSessionAndUser(sessionToken: string) {
      const session = await prisma.session.findUnique({
        where: { sessionToken },
        include: {
          user: { select: userSelect as any },
        },
      });
      if (!session) return null;
      const { user, ...rest } = session;
      return { session: rest as any, user: user as any };
    },
  };
}
