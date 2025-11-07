import '../sentry.server.config';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { auth } from '@/auth';
// v4 uses getServerSession
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Custom Cocktails Platform',
  description: 'Multi-tenant cocktail bar quiz and fulfilment system'
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html className={inter.variable} lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}

