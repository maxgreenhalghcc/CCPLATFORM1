// web/app/api/auth/[...nextauth]/route.ts
import NextAuth, { type NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/prisma"; // keep this import path as in your project
import nodemailer from "nodemailer";

export const authOptions: NextAuthOptions = {
  // Use DB sessions so we avoid JWT decryption issues
  session: { strategy: "database" },

  // Prisma adapter is required for email sign-in in v5
  adapter: PrismaAdapter(prisma),

  // NEXTAUTH_SECRET is used for cookies/session signing (still required)
  secret: process.env.NEXTAUTH_SECRET,

  providers: [
    EmailProvider({
      // dev-friendly: print the email as JSON in the terminal unless EMAIL_SERVER is provided
      server: process.env.EMAIL_SERVER
        ? JSON.parse(process.env.EMAIL_SERVER)
        : { jsonTransport: true },

      // make sure "from" is always defined and in a valid email form
      from: process.env.EMAIL_FROM ?? "Custom Cocktails <no-reply@localhost>",

      // Implement our own mail sender to avoid the upstream crash
      async sendVerificationRequest({ identifier, url, provider, theme }) {
        const transport = nodemailer.createTransport(
          provider.server ?? { jsonTransport: true }
        );

        const { host } = new URL(url);
        const subject = `Sign in to ${host}`;

        const text = `Sign in to ${host}\n${url}\n\n` +
          `If you did not request this email, you can safely ignore it.`;

        const html = `
          <body>
            <p>Sign in to <strong>${host}</strong></p>
            <p><a href="${url}">Click here to sign in</a></p>
            <p style="font-size:12px;color:#666">
              If you did not request this email, you can safely ignore it.
            </p>
          </body>
        `;

        await transport.sendMail({
          to: identifier,
          from: provider.from,
          subject,
          text,
          html,
        });

        // Helpful dev output (what you were expecting to see)
        // This appears when jsonTransport=true
        console.log("Magic link for", identifier);
        console.log(url);
      },

      // keep magic link short-lived in dev
      maxAge: 10 * 60, // 10 minutes
    }),
  ],

  // keep NextAuth debug on while we stabilize
  debug: process.env.NEXTAUTH_DEBUG === "1",

  // Optional: make sure /login is used for sign in
  pages: { signIn: "/login" },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

