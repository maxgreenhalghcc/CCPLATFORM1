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
        console.log("\n=== MAGIC LINK (dev) ===");
        console.log("To:", identifier);
        console.log("URL:", url, "\n");
      },
      server: process.env.EMAIL_SERVER
        ? JSON.parse(process.env.EMAIL_SERVER)
        : undefined,
      from: process.env.EMAIL_FROM ?? `Custom Cocktails <no-reply@localhost>`,
      maxAge: 10 * 60,
    }),
  ],

  // ✅ Put `role` into the JWT and Session so server/pages can read it
  callbacks: {
    async jwt({ token, user }) {
      // on first sign-in `user` is defined; thereafter we keep values in token
      if (user) {
        // @ts-expect-error - your Prisma User likely has a `role` field
        token.role = user.role ?? token.role ?? "staff";
      }
      return token;
    },
    async session({ session, token, user }) {
      if (session.user) {
        // prefer DB user if available, otherwise fall back to token
        // @ts-expect-error augmenting user
        session.user.id = user?.id ?? token.sub ?? session.user.id;
        // @ts-expect-error augmenting user
        session.user.role = user?.role ?? token.role ?? "staff";
      }
      return session;
    },
  },

  // ✅ (Dev convenience) ensure new magic-link users get a role
  events: {
    async createUser({ user }) {
      try {
        // If your Prisma User model has a Role enum, adjust value accordingly
        // @ts-expect-error: depends on your schema field name/type
        await prisma.user.update({
          where: { id: user.id },
          data: { role: "staff" },
        });
      } catch (e) {
        console.log("[events.createUser] role defaulting skipped:", e);
      }
    },
  },

  // ✅ Dev-safe cookies so the browser keeps the session on http://localhost
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

