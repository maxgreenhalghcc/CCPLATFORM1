import NextAuth, { type NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma"; // make sure this exists: web/lib/prisma.ts

export const authOptions: NextAuthOptions = {
  // Email login requires an adapter
  adapter: PrismaAdapter(prisma),
  // DB sessions work well with Email; JWT would also work if you prefer
  session: { strategy: "database" },

  providers: [
    EmailProvider({
      // In dev we default to JSON transport so the magic link prints in your terminal
      server: process.env.EMAIL_SERVER
        ? JSON.parse(process.env.EMAIL_SERVER)
        : { jsonTransport: true },

      // Make sure "from" is always defined
      from: process.env.EMAIL_FROM ?? "no-reply@localhost",
      // how long the magic-link is valid
      maxAge: 10 * 60, // 10 minutes
    }),
  ],

  pages: {
    signIn: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NEXTAUTH_DEBUG === "1",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
