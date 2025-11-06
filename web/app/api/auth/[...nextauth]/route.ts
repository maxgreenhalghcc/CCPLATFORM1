import NextAuth, { type NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma"; // make sure this points to web/lib/prisma.ts

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  // Use DB sessions so we don't rely on JWT decryption
  session: { strategy: "database" },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    EmailProvider({
      // JSON transport prints the magic link in your terminal
      server: process.env.EMAIL_SERVER
        ? JSON.parse(process.env.EMAIL_SERVER)
        : { jsonTransport: true },
      from: process.env.EMAIL_FROM ?? "no-reply@localhost",
      maxAge: 10 * 60, // 10 minutes
      sendVerificationRequest({ identifier, url, provider }) {
        // This is a safety fix for the "concat" crash
        console.log("Magic link for", identifier);
        console.log("Click to sign in:", url);
      },
    }),
  ],
  pages: { signIn: "/login" },
  debug: process.env.NEXTAUTH_DEBUG === "1",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
