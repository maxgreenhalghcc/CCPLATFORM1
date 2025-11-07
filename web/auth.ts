// web/auth.ts
import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";

const isDev = process.env.NODE_ENV !== "production";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Use DB sessions so we avoid JWE issues entirely
  session: { strategy: "database" },

  // One secret for everything
  secret: process.env.NEXTAUTH_SECRET,

  // Prisma adapter for users/sessions/verification tokens
  adapter: PrismaAdapter(prisma),

  // Email magic-link provider
  providers: [
    EmailProvider({
      // In dev: don't send real email — just print the link to the console
      server: isDev
        ? { jsonTransport: true }
        : JSON.parse(process.env.EMAIL_SERVER || "{}"),

      from: process.env.EMAIL_FROM ?? "Custom Cocktails <no-reply@localhost>",
      maxAge: 10 * 60, // 10 minutes

      // Dev-only override: print the magic link and make sure host/protocol match NEXTAUTH_URL
      async sendVerificationRequest({ identifier, url }) {
        if (!isDev) return; // prod will use the SMTP server above

        const base = process.env.NEXTAUTH_URL || "http://localhost:3000";
        const u = new URL(url);
        const b = new URL(base);
        u.host = b.host;
        u.protocol = b.protocol;

        console.log("\nMagic link for", identifier);
        console.log(u.toString(), "\n");
      },
    }),
  ],

  // Where the email form lives
  pages: { signIn: "/login" },

  // Helpful while stabilizing
  debug: process.env.NEXTAUTH_DEBUG === "1",
});
