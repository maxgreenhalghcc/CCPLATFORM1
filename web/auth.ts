import CredentialsProvider from 'next-auth/providers/credentials';
import { getServerSession, type NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { UserRole } from '@prisma/client';
import nodemailer from 'nodemailer';
import { sign } from 'jsonwebtoken';
import prisma from './lib/prisma';
import bcrypt from 'bcryptjs';

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
          html: `<p>Click the link below to sign in:</p><p><a href="${url}">${url}</a></p>`,
        });

        const usesJsonTransport = Boolean(
          (transport as any)?.options?.jsonTransport,
        );

        if (usesJsonTransport) {
          console.info(`[auth] Magic link for ${identifier}: ${url}`);
        }
      },
    }),

    CredentialsProvider({
      id: 'credentials',
      name: 'Staff PIN',
      credentials: {
        slug: { label: 'Bar slug', type: 'text' },
        pin: { label: 'Staff PIN', type: 'password' },
      },
      async authorize(credentials) {
        const slug = credentials?.slug;
        const pin = credentials?.pin;

        if (!slug || !pin) return null;

        // Load bar via raw SQL to get staffPinHash reliably
        const rows =
          await prisma.$queryRaw<
            { id: string; slug: string; staffPinHash: string | null }[]
          >`SELECT id, slug, staffPinHash FROM Bar WHERE slug = ${slug} LIMIT 1`;

        const bar = rows[0] ?? null;

        if (!bar || !bar.staffPinHash) return null;

        const ok = await bcrypt.compare(pin, bar.staffPinHash);
        if (!ok) return null;

        // Load or create a staff user for this bar
        let staffUser = await prisma.user.findFirst({
          where: {
            barId: bar.id,
            role: UserRole.staff,
          },
        });

        if (!staffUser) {
          staffUser = await prisma.user.create({
            data: {
              email: `staff+${bar.slug}@demo.local`,
              role: 'staff',
              barId: bar.id,
              name: `Staff for ${bar.slug}`,
            },
          });
        }

        return {
          ...staffUser,
          barSlug: bar.slug,
        } as any;
      },
    }),
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
        (token as any).barSlug = (user as any).barSlug ?? null;
        token.email = user.email;
      } else if (!token.role && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          include: { bar: true },
        });

        if (dbUser) {
          token.role = dbUser.role;
          token.barId = dbUser.barId ?? null;
          (token as any).barSlug = dbUser.bar?.slug ?? null;
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
        barId: (token.barId as string | null) ?? null,
      };

      const secret = process.env.NEXTAUTH_SECRET;
      if (secret && token.sub) {
        session.apiToken = sign(
          {
            sub: token.sub,
            email,
            role: token.role,
            barId: token.barId ?? null,
          },
          secret,
          { expiresIn: '5m' }
        );
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      const target = new URL(url, baseUrl);

      if (target.pathname === '/staff/orders') {
        return `${baseUrl}/staff`;
      }

      if (target.origin === baseUrl) {
        return target.toString();
      }

      return baseUrl;
    },
  },
};

export function auth() {
  return getServerSession(authOptions);
}
