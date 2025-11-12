import NextAuth, { type NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import prisma from "@/lib/prisma";
import { SafePrismaAdapter } from "@/lib/safe-prisma-adapter";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  adapter: SafePrismaAdapter(prisma),

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

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // @ts-expect-error project-specific
        token.role = user.role ?? token.role ?? "staff";
        // @ts-expect-error project-specific
        token.barId = user.barId ?? token.barId ?? "demo-bar";
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        // @ts-expect-error augment
        session.user.id = token.sub ?? session.user.id;
        // @ts-expect-error augment
        session.user.role = (token as any).role ?? "staff";
        // @ts-expect-error augment
        session.user.barId = (token as any).barId ?? "demo-bar";
      }
      // @ts-expect-error augment (dev convenience)
      session.apiToken = process.env.DEV_API_TOKEN ?? "dev-token";
      return session;
    },
  },

  events: {
    async createUser({ user }) {
      try {
        // @ts-expect-error project-specific
        await prisma.user.update({ where: { id: user.id }, data: { role: "staff" } });
      } catch (e) {
        console.log("[events.createUser] role defaulting skipped:", e);
      }
    },
  },

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

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
