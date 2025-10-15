import Link from 'next/link';

const links = [
  { href: '/b/sample-bar', label: 'Sample Bar' },
  { href: '/staff', label: 'Staff Dashboard' },
  { href: '/admin', label: 'Admin Console' }
];

export function MainNav() {
  return (
    <header className="border-b bg-card/60 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link className="text-xl font-semibold" href="/">
          Custom Cocktails
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
          {links.map((link) => (
            <Link className="transition hover:text-foreground" href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
