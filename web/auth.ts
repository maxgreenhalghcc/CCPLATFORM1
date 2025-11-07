// web/auth.ts
import NextAuth from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma";

const isDev = process.env.NODE_ENV !== "production";

const authOptions = {
  session: { strategy: "database" },
  secret: process.env.NEXTAUTH_SECRET,
  adapter: PrismaAdapter(prisma),
  providers: [
    EmailProvider({
      server: isDev
        ? { jsonTransport: true }
        : JSON.parse(process.env.EMAIL_SERVER || "{}"),
      from: process.env.EMAIL_FROM ?? "Custom Cocktails <no-reply@localhost>",
      maxAge: 10 * 60,
      async sendVerificationRequest({ identifier, url }) {
        if (!isDev) return;
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
  pages: { signIn: "/login" },
  debug: process.env.NEXTAUTH_DEBUG === "1",
};

const { handlers, auth, signIn, signOut } = NextAuth(authOptions);

export const GET = handlers.GET;
export const POST = handlers.POST;
export { auth, signIn, signOut };
