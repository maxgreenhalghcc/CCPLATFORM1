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

 callbacks: {
  async jwt({ token, user }) {
    if (user) {
      // @ts-expect-error depends on your schema
      token.role = user.role ?? token.role ?? "staff";
      // Optional: if your User has barId
      // @ts-expect-error
      token.barId = user.barId ?? token.barId;
    }
    return token;
  },
  async session({ session, token }) {
    if (session.user) {
      // Ensure id/role are available to pages
      // @ts-expect-error augmenting
      session.user.id = token.sub ?? session.user.id;
      // @ts-expect-error augmenting
      session.user.role = (token as any).role ?? "staff";
      // @ts-expect-error augmenting
      session.user.barId = (token as any).barId ?? "demo-bar";
    }

    // ✅ DEV: always provide a token so staff page won’t throw
    // If you later store a real API token in DB, replace this with that value.
    // @ts-expect-error augmenting
    session.apiToken = process.env.DEV_API_TOKEN ?? "dev-token";

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

