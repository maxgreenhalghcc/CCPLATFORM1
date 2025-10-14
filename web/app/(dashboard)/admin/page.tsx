import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
];

export default function AdminDashboardPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">Admin console</h1>
        <p className="text-muted-foreground">
          Configure the Custom Cocktails platform and monitor bar performance.
        </p>
      </header>
      <section className="grid gap-6 md:grid-cols-2">
        {cards.map((card) => (
          <article className="flex flex-col gap-3 rounded-2xl border bg-card p-6 shadow-sm" key={card.href}>
            <div>
              <h2 className="text-xl font-semibold">{card.title}</h2>
              <p className="text-sm text-muted-foreground">{card.description}</p>
            </div>
            <Button asChild variant="outline">
              <Link href={card.href}>Open</Link>
            </Button>
          </article>
        ))}
      </section>
    </div>
  );
}
