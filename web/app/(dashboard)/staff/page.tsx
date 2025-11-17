import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { apiFetch, getApiBaseUrl } from '@/app/lib/api';
import StaffOrdersClient, { type OrderSummary } from './staff-orders-client';

async function fetchOrders(token: string, barIdentifier: string): Promise<OrderSummary[]> {
  const baseUrl = getApiBaseUrl();
  const res = await apiFetch(`${baseUrl}/v1/bars/${barIdentifier}/orders`, {
    cache: 'no-store',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error('Not authorised to view orders for this bar');
    }
    throw new Error('Unable to load orders');
  }

  const payload = (await res.json()) as {
    items: Array<{
      id: string;
      status: OrderSummary['status'];
      createdAt: string;
      fulfilledAt?: string | null;
      recipeName?: string | null;
    }>;
  };

  return payload.items.map((item) => ({
    ...item,
    fulfilledAt: item.fulfilledAt ?? null,
    recipeName: item.recipeName ?? 'Custom cocktail',
  }));
}

async function StaffOrdersTable({ token, barId }: { token: string; barId: string }) {
  try {
    const orders = await fetchOrders(token, barId);
    return <StaffOrdersClient initialOrders={orders} />;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load orders.';
    return <StaffOrdersClient initialOrders={[]} initialError={message} />;
  }
}

export default async function StaffDashboardPage() {
  const session = await auth();

  if (!session || session.user.role !== 'staff') {
    redirect(`/login?callbackUrl=${encodeURIComponent('/staff')}`);
  }

  if (!session.apiToken) {
    throw new Error('Missing API token for staff session');
  }

  const barId = session.user.barId ?? 'demo-bar';

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Staff orders</h1>
        <p className="text-muted-foreground">
          Monitor live orders and access generated recipes once payments clear.
        </p>
        <nav className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
          <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">Orders</span>
          <Link className="rounded-full border border-border px-3 py-1 transition hover:border-primary/60 hover:text-foreground" href="/staff/details">
            Venue details
          </Link>
        </nav>
      </header>
      <Suspense fallback={<p>Loading orders…</p>}>
        {/* @ts-expect-error Async Server Component */}
        <StaffOrdersTable barId={barId} token={session.apiToken} />
      </Suspense>
    </div>
  );
}
