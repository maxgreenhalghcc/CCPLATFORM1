import '../sentry.server.config';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { auth } from '@/auth';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  title: 'Custom Cocktails Platform',
  description: 'Multi-tenant cocktail bar quiz and fulfilment system'
};

interface RootLayoutProps {
  children: React.ReactNode;
}

/**
 * Provides the application's root HTML layout, applying the global font, body classes, and wrapping content with app providers.
 *
 * @param children - The React nodes rendered inside the layout
 * @returns The root React element containing the `<html>` and `<body>` structure with global classes and the `Providers`-wrapped `children`
 */
export default async function RootLayout({ children }: RootLayoutProps) {
  const session = await auth();

  return (
    <html className={inter.variable} lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}