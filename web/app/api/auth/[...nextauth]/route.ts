import NextAuth, { type NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma"; // your prisma singleton (web/lib/prisma.ts)

export const authOptions: NextAuthOptions = {
  // Use DB-backed sessions (no JWT decryption problems)
  session: { strategy: "database" },

  // One secret for everything
  secret: process.env.NEXTAUTH_SECRET,

  // Prisma adapter
  adapter: PrismaAdapter(prisma),

  // Email magic-link provider
  providers: [
    EmailProvider({
      // We’ll supply a safe transport below regardless of env parsing issues
      server: { jsonTransport: true },
      from: process.env.EMAIL_FROM ?? "Custom Cocktails <no-reply@localhost>",
      maxAge: 10 * 60, // 10 minutes

      /**
       * Override how the verification email is "sent".
       * With jsonTransport, nodemailer gives us the URL we need—log it clearly.
       */
      async sendVerificationRequest({ identifier, url, provider }) {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const nodemailer = require("nodemailer");
        const transport = nodemailer.createTransport(provider.server);

        const result = await transport.sendMail({
          to: identifier,
          from: provider.from,
          subject: "Your sign-in link",
          text: `Sign in: ${url}`,
          html: `<p>Click to sign in:</p><p><a href="${url}">${url}</a></p>`,
        });

        // Make the link extremely obvious in the dev terminal
        const preview = (result?.message || result);
        console.log("\n\x1b[36mMagic link for\x1b[0m", identifier);
        console.log(url, "\n");
      },
    }),
  ],

  // Where to show the email form
  pages: { signIn: "/login" },

  // Helpful while we’re stabilising
  debug: process.env.NEXTAUTH_DEBUG === "1",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };


