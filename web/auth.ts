// web/auth.ts
import NextAuth, { type NextAuthConfig } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma"; // keep this path if your prisma singleton is at web/lib/prisma.ts

export const authOptions: NextAuthConfig = {
  // Use DB-backed sessions so nothing tries to decrypt JWTs anymore
  session: { strategy: "database" },

  // One secret for everything (keep your existing value)
  secret: process.env.NEXTAUTH_SECRET,

  // Prisma for users/sessions/verification tokens
  adapter: PrismaAdapter(prisma),

  // Email “magic link” provider
  providers: [
    EmailProvider({
      // Dev-safe: print the magic link to your terminal (no SMTP required)
      server: { jsonTransport: true },
      from: process.env.EMAIL_FROM ?? `Custom Cocktails <no-reply@localhost>`,
      maxAge: 10 * 60, // 10 minutes

      // Fully override: don't try to send email, just log the link
      async sendVerificationRequest({ identifier, url }) {
        // Make sure the printed link uses the right host/protocol
        const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
        const safeUrl = new URL(url);
        const baseUrl = new URL(base);
        safeUrl.host = baseUrl.host;
        safeUrl.protocol = baseUrl.protocol;

        console.log("\nMagic link for", identifier);
        console.log(safeUrl.toString(), "\n");
      },
    }),
  ],

  // Where to show the email form
  pages: { signIn: "/login" },

  // Helpful while we’re stabilising
  debug: process.env.NEXTAUTH_DEBUG === "1",
};

export const { handlers, auth, signIn, signOut } = NextAuth(authOptions);
export type { NextAuthConfig };
