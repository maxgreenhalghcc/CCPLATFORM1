"use client";

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

const SHOW_BETA_BADGE =
  (process.env.NEXT_PUBLIC_FEATURE_SHOW_BETA_BADGE ?? 'false').toLowerCase() === 'true';

const links: Array<{ href: string; label: string; roles?: Array<'admin' | 'staff'> }> = [
  { href: '/b/sample-bar', label: 'Sample Bar' },
  { href: '/staff', label: 'Staff Orders', roles: ['staff'] },
  { href: '/staff/details', label: 'Staff Details', roles: ['staff'] },
  { href: '/admin', label: 'Admin Console', roles: ['admin'] }
];

export function MainNav() {
  const { data: session } = useSession();
  const role = session?.user.role;

  const visibleLinks = links.filter((link) => {
    if (!link.roles) {
      return true;
    }
    if (!role) {
      return false;
    }
    return link.roles.includes(role);
  });

  return (
    <header className="border-b bg-card/60 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link className="flex items-center gap-2 text-xl font-semibold" href="/">
          Custom Cocktails
          {SHOW_BETA_BADGE ? (
            <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Beta
            </span>
          ) : null}
        </Link>
        <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
          <nav className="flex items-center gap-4">
            {visibleLinks.map((link) => (
              <Link className="transition hover:text-foreground" href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
          {session ? (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="hidden sm:inline">{session.user.email}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => signOut({ callbackUrl: '/' })}
              >
                Sign out
              </Button>
            </div>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
