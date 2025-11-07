import NextAuth, { type NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma"; // your prisma singleton

export const authOptions: NextAuthOptions = {
  // DB-backed sessions avoid JWT decryption issues during email callbacks
  session: { strategy: "database" },

  // One secret for everything
  secret: process.env.NEXTAUTH_SECRET,

  // Use Prisma for users/sessions/verification tokens
  adapter: PrismaAdapter(prisma),

  // Email “magic link” provider – dev-safe
  providers: [
    EmailProvider({
      // Ignore EMAIL_SERVER in dev; just print the link to the console
      server: { jsonTransport: true },
      from: process.env.EMAIL_FROM ?? "Custom Cocktails <no-reply@localhost>",
      maxAge: 10 * 60, // 10 minutes

      // Dev override: print the link and don't talk to any SMTP transport
      async sendVerificationRequest({ identifier, url }) {
        // Make sure the URL uses your NEXTAUTH_URL base
        const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
        const safeUrl = new URL(url);
        safeUrl.host = new URL(base).host;
        safeUrl.protocol = new URL(base).protocol;

        console.log("\nMagic link for", identifier);
        console.log(safeUrl.toString(), "\n");
      },
    }),
  ],

  // Route overrides (keep your current login page)
  pages: { signIn: "/login" },

  // Handy while stabilising
  debug: process.env.NEXTAUTH_DEBUG === "1",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
