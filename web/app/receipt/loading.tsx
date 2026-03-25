import { AppShell } from '@/app/components/AppShell';

export default function ReceiptLoading() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-4xl px-6 py-16">
        <header className="space-y-3 text-center">
          <div className="mx-auto h-3 w-32 animate-pulse rounded-full bg-muted" />
          <div className="mx-auto h-10 w-64 animate-pulse rounded-xl bg-muted" />
          <div className="mx-auto h-4 w-80 animate-pulse rounded-full bg-muted" />
        </header>

        <section className="mt-12 space-y-6 rounded-2xl border border-border/50 bg-card/80 p-10 shadow-card">
          <div className="h-5 w-28 animate-pulse rounded-lg bg-muted" />
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-12 w-full animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="h-36 animate-pulse rounded-2xl bg-muted" />
            <div className="h-36 animate-pulse rounded-2xl bg-muted" />
          </div>
        </section>

        <div className="mt-12 flex flex-col items-center gap-4">
          <div className="h-4 w-72 animate-pulse rounded-full bg-muted" />
          <div className="h-9 w-28 animate-pulse rounded-lg bg-muted" />
        </div>
      </div>
    </AppShell>
  );
}
