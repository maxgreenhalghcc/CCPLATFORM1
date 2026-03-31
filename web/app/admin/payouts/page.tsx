import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { apiFetch, getApiBaseUrl } from '@/app/lib/api';
import { DashboardShell } from '@/app/components/DashboardShell';
import { LiftIn } from '@/app/components/motion';
import PayoutsClient from './payouts-client';

async function fetchPayouts(token: string) {
  const base = getApiBaseUrl();
  const res = await apiFetch(`${base}/v1/admin/payouts`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json() as Promise<
    Array<{
      id: string;
      barId: string;
      barName: string;
      weekStart: string;
      fulfilledCount: number;
      tierName: string | null;
      payoutAmount: number;
      payoutStatus: 'PENDING' | 'PAID';
      paidAt: string | null;
    }>
  >;
}

export default async function PayoutsPage() {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    redirect(`/login?callbackUrl=${encodeURIComponent('/admin/payouts')}`);
  }
  if (!session.apiToken) throw new Error('Missing API token');

  const payouts = await fetchPayouts(session.apiToken);

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16">
        <LiftIn delay={0.05}>
          <header className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/admin" className="hover:text-foreground">Admin</Link>
              <span>/</span>
              <span>Payouts</span>
            </div>
            <h1 className="text-3xl font-semibold">Staff payouts</h1>
            <p className="text-muted-foreground">
              Review weekly performance payouts and mark them as paid once transferred.
            </p>
          </header>
        </LiftIn>
        <PayoutsClient
          initialPayouts={payouts.map((p) => ({ ...p, payoutAmount: Number(p.payoutAmount) }))}
          token={session.apiToken}
        />
      </div>
    </DashboardShell>
  );
}
