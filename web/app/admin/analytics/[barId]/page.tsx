import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { apiFetch, getApiBaseUrl } from '@/app/lib/api';
import { DashboardShell } from '@/app/components/DashboardShell';
import { LiftIn } from '@/app/components/motion';
import AnalyticsClient from './analytics-client';

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

export default async function AnalyticsPage({ params }: Props) {
  const session = await auth();
  if (!session || session.user.role !== 'admin') {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/admin/analytics/${params.barId}`)}`);
  }
  if (!session.apiToken) throw new Error('Missing API token');

  const bar = await fetchBar(session.apiToken, params.barId);
  if (!bar) redirect('/admin/bars');

  return (
    <DashboardShell>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16">
        <LiftIn delay={0.05}>
          <header className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link href="/admin" className="hover:text-foreground">Admin</Link>
              <span>/</span>
              <Link href="/admin/bars" className="hover:text-foreground">Bars</Link>
              <span>/</span>
              <span>{bar.name}</span>
              <span>/</span>
              <span>Analytics</span>
            </div>
            <h1 className="text-3xl font-semibold">Funnel analytics</h1>
            <p className="text-muted-foreground">
              Track guest conversion from page load through to fulfilled order for {bar.name}.
            </p>
          </header>
        </LiftIn>
        <AnalyticsClient barId={bar.id} barName={bar.name} token={session.apiToken} />
      </div>
    </DashboardShell>
  );
}
