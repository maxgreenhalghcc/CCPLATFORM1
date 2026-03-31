import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { apiFetch, getApiBaseUrl } from '@/app/lib/api';
import { DashboardShell } from '@/app/components/DashboardShell';
import { LiftIn } from '@/app/components/motion';
import IncentivesClient from './incentives-client';

interface Props {
  params: { barId: string };
}

async function fetchBar(token: string, barId: string) {
  const base = getApiBaseUrl();
  const res = await apiFetch(`${base}/v1/bars/${barId}`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json() as Promise<{ id: string; name: string }>;
}

async function fetchTiers(token: string, barId: string) {
  const base = getApiBaseUrl();
  const res = await apiFetch(`${base}/v1/admin/bars/${barId}/incentive-tiers`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json() as Promise<
    Array<{ id: string; name: string; threshold: number; payoutAmount: number; sortOrder: number }>
  >;
}

async function fetchSettings(token: string, barId: string) {
  const base = getApiBaseUrl();
  const res = await apiFetch(`${base}/v1/bars/${barId}/settings`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json() as Promise<{ weeklyBaseline?: number | null }>;
}

export default async function IncentivesPage({ params }: Props) {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/admin/incentives/${params.barId}`)}`);
  }
  if (!session.apiToken) throw new Error('Missing API token');

  const [bar, tiers, settings] = await Promise.all([
    fetchBar(session.apiToken, params.barId),
    fetchTiers(session.apiToken, params.barId),
    fetchSettings(session.apiToken, params.barId),
  ]);

  if (!bar) redirect('/admin/bars');

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-16">
        <LiftIn delay={0.05}>
          <header className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/admin" className="hover:text-foreground">Admin</Link>
              <span>/</span>
              <Link href="/admin/bars" className="hover:text-foreground">Bars</Link>
              <span>/</span>
              <span>{bar.name}</span>
              <span>/</span>
              <span>Incentives</span>
            </div>
            <h1 className="text-3xl font-semibold">Incentive tiers</h1>
            <p className="text-muted-foreground">
              Configure weekly performance targets and staff payouts for {bar.name}.
            </p>
          </header>
        </LiftIn>
        <IncentivesClient
          barId={bar.id}
          barName={bar.name}
          initialTiers={tiers.map((t) => ({ ...t, payoutAmount: Number(t.payoutAmount) }))}
          initialBaseline={settings?.weeklyBaseline ?? null}
          token={session.apiToken}
        />
      </div>
    </DashboardShell>
  );
}
