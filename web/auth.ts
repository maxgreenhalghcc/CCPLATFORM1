import NextAuth, { type NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "database" },
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),

  providers: [
    EmailProvider({
      async sendVerificationRequest({ identifier, url }) {
        // Dev: print magic link instead of sending email
        console.log("\n=== MAGIC LINK (dev) ===");
        console.log("To:", identifier);
        console.log("URL:", url, "\n");
      },
      server: process.env.EMAIL_SERVER
        ? JSON.parse(process.env.EMAIL_SERVER)
        : undefined,
      from: process.env.EMAIL_FROM ?? `Custom Cocktails <no-reply@localhost>`,
      maxAge: 10 * 60, // 10 minutes
    }),
  ],

  callbacks: {
    // NOTE: With strategy: "database", do not read from `token`.
    // Use `user` when present (on sign-in) or fetch from DB using session.user.email.
    async session({ session, user }) {
      if (!session.user?.email) return session;

      let id: string | undefined = (user as any)?.id;
      let role: string | undefined = (user as any)?.role;
      let barId: string | undefined = (user as any)?.barId;
      let apiToken: string | undefined = (user as any)?.apiToken;

      if (!id || !role || !barId || !apiToken) {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { id: true, role: true, barId: true, apiToken: true },
        });
        if (dbUser) {
          id ??= dbUser.id;
          role ??= (dbUser as any).role;
          barId ??= (dbUser as any).barId;
          apiToken ??= (dbUser as any).apiToken ?? undefined;
        }
      }

      // Attach to session for server components/pages
      // @ts-expect-error augmenting SessionUser
      session.user.id = id ?? session.user.id;
      // @ts-expect-error augmenting SessionUser
      session.user.role = role ?? "staff";
      // @ts-expect-error augmenting SessionUser
      session.user.barId = barId ?? "demo-bar";
      // @ts-expect-error augmenting Session
      session.apiToken = apiToken ?? process.env.DEV_API_TOKEN ?? "dev-token";

      return session;
    },
  },

  // Dev: default any new magic-link user to "staff" role
  events: {
    async createUser({ user }) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          // Adjust if your schema uses an enum type
          // @ts-expect-error app-specific field
          data: { role: "staff" },
        });
      } catch (e) {
        console.log("[events.createUser] role default skipped:", e);
      }
    },
  },

  // Dev-safe cookie options for http://localhost
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  pages: { signIn: "/login" },
  debug: process.env.NEXTAUTH_DEBUG === "1",
};

// v4 handler export
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
