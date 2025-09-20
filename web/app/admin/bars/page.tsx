import { Button } from '@/components/ui/button';

export default function AdminBarsPage() {
  return (
    <div className="space-y-6 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Bars</h1>
        <p className="text-sm text-muted-foreground">
          Manage bar tenants, configure branding, and assign Stripe accounts.
        </p>
      </header>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Registered bars</h2>
        <Button>Add bar</Button>
      </div>
      <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Data loading is not yet connected. Integrate with `/v1/bars` in the next iteration.
      </p>
    </div>
  );
}
