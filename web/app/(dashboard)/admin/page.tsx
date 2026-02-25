import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { auth } from '@/auth';
import { DashboardShell } from '@/app/components/DashboardShell';
import { LiftIn, StaggerChildren, StaggerItem } from '@/app/components/motion';

const cards = [
  {
    title: 'Manage bars',
    description: 'Create new bar tenants, configure branding, and manage pricing.',
    href: '/admin/bars'
  },
  {
    title: 'Ingredients',
    description: 'Maintain the global ingredient catalogue and allergen flags.',
    href: '/admin/ingredients'
  },
  {
    title: 'Financial dashboard',
    description: 'Track revenue per bar, order volumes, and payout readiness.',
    href: '/admin/financials'
  }
] as const;

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    redirect(`/login?callbackUrl=${encodeURIComponent('/admin')}`);
  }

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16">
        <LiftIn delay={0.05}>
          <header className="space-y-2">
            <h1 className="text-3xl font-semibold">Admin console</h1>
            <p className="text-muted-foreground">
              Configure the Custom Cocktails platform and monitor bar performance.
            </p>
          </header>
        </LiftIn>
        <StaggerChildren className="grid gap-6 md:grid-cols-2">
          {cards.map((card) => (
            <StaggerItem key={card.href}>
              <article className="flex h-full flex-col gap-3 rounded-2xl border border-border/[var(--border-alpha,0.5)] bg-card/80 p-6 shadow-card">
                <div>
                  <h2 className="text-xl font-semibold">{card.title}</h2>
                  <p className="text-sm text-muted-foreground">{card.description}</p>
                </div>
                <Button asChild variant="outline" className="mt-auto">
                  <Link href={card.href}>Open</Link>
                </Button>
              </article>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </DashboardShell>
  );
}
