// web/auth.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  // Use Prisma DB-backed sessions (requires the Prisma Adapter)
  session: { strategy: "database" },
  secret: process.env.NEXTAUTH_SECRET,

  adapter: PrismaAdapter(prisma),

  providers: [
    EmailProvider({
      // ✅ DEV-FRIENDLY: print the magic link instead of sending email
      async sendVerificationRequest({ identifier, url }) {
        console.log("\n=== MAGIC LINK (dev) ===");
        console.log("To:", identifier);
        console.log("URL:", url, "\n");
      },

      // Keep these so you can flip to real SMTP later by setting EMAIL_SERVER
      server: process.env.EMAIL_SERVER
        ? JSON.parse(process.env.EMAIL_SERVER)
        : undefined,
      from: process.env.EMAIL_FROM ?? `Custom Cocktails <no-reply@localhost>`,
      maxAge: 10 * 60, // 10 minutes
    }),
  ],

  pages: { signIn: "/login" },
  debug: process.env.NEXTAUTH_DEBUG === "1",
};

// v4 handler export (used by app/api/auth/[...nextauth]/route.ts)
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
export { authOptions };
