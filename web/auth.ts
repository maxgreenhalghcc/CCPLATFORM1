import { getServerSession, type NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { UserRole } from '@prisma/client';
import nodemailer from 'nodemailer';
import { sign } from 'jsonwebtoken';
import prisma from './lib/prisma';

const fromAddress = process.env.EMAIL_FROM ?? 'login@example.com';

/**
 * Create a Nodemailer transport using the EMAIL_SERVER environment value when provided, otherwise use a JSON transport.
 *
 * @returns A Nodemailer transport configured from `process.env.EMAIL_SERVER` if it is a non-empty string; otherwise a transport with `{ jsonTransport: true }`.
 */
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

/**
 * Retrieve the current server authentication session using the configured NextAuth options.
 *
 * @returns The session object for the current request, or `null` if there is no active session.
 */
export function auth() {
  return getServerSession(authOptions);
}