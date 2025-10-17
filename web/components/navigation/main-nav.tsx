"use client";

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';

const links: Array<{ href: string; label: string; roles?: Array<'admin' | 'staff'> }> = [
  { href: '/b/sample-bar', label: 'Sample Bar' },
  { href: '/staff', label: 'Staff Dashboard', roles: ['staff'] },
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
        <Link className="text-xl font-semibold" href="/">
          Custom Cocktails
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
