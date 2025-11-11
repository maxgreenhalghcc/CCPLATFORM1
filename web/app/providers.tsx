'use client';

import '../sentry.client.config';
import { SessionProvider } from 'next-auth/react';
import type { Session } from 'next-auth';

interface ProvidersProps {
  children: React.ReactNode;
  session: Session | null;
}

/**
 * Wraps UI with NextAuth's SessionProvider so descendant components can access the session.
 *
 * @param children - The React node(s) to render inside the provider
 * @param session - Optional NextAuth session object used to initialize the provider
 * @returns A React element that wraps `children` with a NextAuth SessionProvider initialized with `session`
 */
export function Providers({ children, session }: ProvidersProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}