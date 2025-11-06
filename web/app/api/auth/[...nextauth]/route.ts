import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";

// If EMAIL_SERVER is a JSON string like {"jsonTransport":true}, parse it.
// Fallback to jsonTransport so the magic link is printed to the terminal in dev.
const parsedServer =
  (process.env.EMAIL_SERVER && safeParse(process.env.EMAIL_SERVER)) || { jsonTransport: true };

function safeParse(str?: string) {
  try {
    return str ? JSON.parse(str) : undefined;
  } catch {
    return undefined;
  }
}

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: parsedServer as any,
      from: process.env.EMAIL_FROM || "staff@demo.bar",
      maxAge: 10 * 60, // 10 minutes
    }),
  ],
  // helpful while developing
  debug: process.env.NEXTAUTH_DEBUG === "1",
  // You already have NEXTAUTH_SECRET and NEXTAUTH_URL in .env.local
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
});

export { handler as GET, handler as POST };
