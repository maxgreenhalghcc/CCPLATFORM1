<<<<<<< HEAD
import NextAuth, { type NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import prisma from "@/lib/prisma";
import { SafePrismaAdapter } from "@/lib/safe-prisma-adapter";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  adapter: SafePrismaAdapter(prisma),

  providers: [
    EmailProvider({
      async sendVerificationRequest({ identifier, url }) {
        console.log("\n=== MAGIC LINK (dev) ===");
        console.log("To:", identifier);
        console.log("URL:", url, "\n");
      },
      server: process.env.EMAIL_SERVER
        ? JSON.parse(process.env.EMAIL_SERVER)
        : undefined,
      from: process.env.EMAIL_FROM ?? `Custom Cocktails <no-reply@localhost>`,
      maxAge: 10 * 60,
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // @ts-expect-error project-specific
        token.role = user.role ?? token.role ?? "staff";
        // @ts-expect-error project-specific
        token.barId = user.barId ?? token.barId ?? "demo-bar";
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        // @ts-expect-error augment
        session.user.id = token.sub ?? session.user.id;
        // @ts-expect-error augment
        session.user.role = (token as any).role ?? "staff";
        // @ts-expect-error augment
        session.user.barId = (token as any).barId ?? "demo-bar";
      }
      // @ts-expect-error augment (dev convenience)
      session.apiToken = process.env.DEV_API_TOKEN ?? "dev-token";
      return session;
    },
  },

  events: {
    async createUser({ user }) {
      try {
        // @ts-expect-error project-specific
        await prisma.user.update({ where: { id: user.id }, data: { role: "staff" } });
      } catch (e) {
        console.log("[events.createUser] role defaulting skipped:", e);
      }
    },
  },

  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },

  pages: { signIn: "/login" },
  debug: process.env.NEXTAUTH_DEBUG === "1",
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
=======
import { getServerSession, type NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { UserRole } from '@prisma/client';
import nodemailer from 'nodemailer';
import { sign } from 'jsonwebtoken';
import prisma from './lib/prisma';

const fromAddress = process.env.EMAIL_FROM ?? 'login@example.com';

function createTransport() {
  const server = process.env.EMAIL_SERVER;
  if (server && server.length > 0) {
    return nodemailer.createTransport(server);
  }
  return nodemailer.createTransport({ jsonTransport: true });
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login'
  },
  providers: [
    EmailProvider({
      from: fromAddress,
      maxAge: 15 * 60,
      async sendVerificationRequest({ identifier, url }) {
        const transport = createTransport();
        await transport.sendMail({
          to: identifier,
          from: fromAddress,
          subject: 'Sign in to Custom Cocktails',
          text: `Click the link below to sign in:\n${url}`,
          html: `<p>Click the link below to sign in:</p><p><a href="${url}">${url}</a></p>`
        });

        const usesJsonTransport = Boolean((transport as any)?.options?.jsonTransport);
        if (usesJsonTransport) {
          console.info(`[auth] Magic link for ${identifier}: ${url}`);
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user }) {
      const role = (user.role ?? 'customer') as UserRole;
      return role === UserRole.admin || role === UserRole.staff;
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role as UserRole;
        token.barId = user.barId ?? null;
        token.email = user.email;
      } else if (!token.role && token.email) {
        const dbUser = await prisma.user.findUnique({ where: { email: token.email as string } });
        if (dbUser) {
          token.role = dbUser.role;
          token.barId = dbUser.barId ?? null;
        }
      }
      return token;
    },
    async session({ session, token }) {
      const email = (token.email as string) ?? session.user?.email ?? '';
      session.user = {
        id: (token.sub as string) ?? '',
        email,
        role: (token.role as UserRole) ?? UserRole.customer,
        barId: (token.barId as string | null) ?? null
      };

      const secret = process.env.NEXTAUTH_SECRET;
      if (secret && token.sub) {
        session.apiToken = sign(
          {
            sub: token.sub,
            email,
            role: token.role,
            barId: token.barId ?? null
          },
          secret,
          { expiresIn: '5m' }
        );
      }

      return session;
    }
  }
};

export function auth() {
  return getServerSession(authOptions);
}
>>>>>>> pr-22
