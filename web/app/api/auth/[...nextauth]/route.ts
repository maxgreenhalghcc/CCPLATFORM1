import NextAuth, { type NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  // DB sessions so the server never tries to decrypt a JWT
  session: { strategy: "database" },

  // One secret only (do NOT use JWT_SECRET anywhere)
  secret: process.env.NEXTAUTH_SECRET,

  // Prisma adapter for Users/Sessions tables
  adapter: PrismaAdapter(prisma),

  // Magic-link email provider (prints link in the terminal in dev)
  providers: [
    EmailProvider({
      server: process.env.EMAIL_SERVER
        ? JSON.parse(process.env.EMAIL_SERVER)
        : { jsonTransport: true },
      from: process.env.EMAIL_FROM ?? "no-reply@localhost",
      maxAge: 10 * 60, // 10 minutes
    }),
  ],

  pages: { signIn: "/login" },

  debug: process.env.NEXTAUTH_DEBUG === "1",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
