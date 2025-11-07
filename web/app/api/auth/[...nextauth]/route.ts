// web/app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma"; // your existing prisma singleton

export const authOptions: NextAuthOptions = {
  // Use DB-backed sessions so we don’t have to decrypt JWTs
  session: { strategy: "database" },

  // One secret for everything (matches .env.local)
  secret: process.env.NEXTAUTH_SECRET,

  // Prisma adapter for User / Session / VerificationToken tables
  adapter: PrismaAdapter(prisma),

  // Magic-link email provider
  providers: [
    EmailProvider({
      // In dev we print the link instead of sending mail
      server: process.env.EMAIL_SERVER
        ? JSON.parse(process.env.EMAIL_SERVER)
        : { jsonTransport: true },
      from: process.env.EMAIL_FROM ?? "no-reply@localhost",
      maxAge: 10 * 60, // 10 minutes
    }),
  ],

  // Where to show the email form
  pages: { signIn: "/login" },

  // Helpful while we’re stabilising
  debug: process.env.NEXTAUTH_DEBUG === "1",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
