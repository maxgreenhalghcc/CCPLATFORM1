import { DashboardShell } from '@/app/components/DashboardShell';
import { LiftIn } from '@/app/components/motion';

export default function AdminIngredientsPage() {
  return (
    <DashboardShell>
      <div className="space-y-6 px-6 py-16">
        <LiftIn delay={0.05}>
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold">Ingredients</h1>
            <p className="text-sm text-muted-foreground">
              Maintain the master ingredient library. Configure allergen flags and default availability.
            </p>
          </header>
        </LiftIn>
        <p className="rounded-xl border border-border/[var(--border-alpha,0.5)] bg-card/80 p-6 text-sm text-muted-foreground shadow-card">
          Ingredient management UI placeholder. Connect to `/v1/admin/metrics/ingredients` and future CRUD endpoints.
        </p>
      </div>
    </DashboardShell>
  );
}
