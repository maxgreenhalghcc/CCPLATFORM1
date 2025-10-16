import { Suspense } from 'react';
import { buildGuardHeaders, getApiBaseUrl } from '@/app/lib/api';
import StaffOrdersClient from './staff-orders-client';

type OrderStatus = 'created' | 'paid' | 'cancelled' | 'fulfilled';

interface OrderSummary {
  id: string;
  status: OrderStatus;
  createdAt: string;
  fulfilledAt: string | null;
}

async function fetchOrders(): Promise<OrderSummary[]> {
  const baseUrl = getApiBaseUrl();
  const barSlug = process.env.NEXT_PUBLIC_STAFF_BAR_SLUG ?? 'sample-bar';
  const headers = buildGuardHeaders();
  const res = await fetch(`${baseUrl}/v1/bars/${barSlug}/orders`, {
    cache: 'no-store',
    headers
  });
  if (!res.ok) {
    return [];
  }
  const payload = (await res.json()) as {
    items: Array<{
      id: string;
      status: OrderStatus;
      createdAt: string;
      fulfilledAt?: string | null;
    }>;
  };
  return payload.items.map((item) => ({
    ...item,
    fulfilledAt: item.fulfilledAt ?? null
  }));
}

async function StaffOrdersTable() {
  const orders = await fetchOrders();
  return <StaffOrdersClient initialOrders={orders} />;
}

export default function StaffDashboardPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Staff orders</h1>
        <p className="text-muted-foreground">
          Monitor live orders and access generated recipes once payments clear.
        </p>
      </header>
      <Suspense fallback={<p>Loading orders…</p>}>
        {/* @ts-expect-error Async Server Component */}
        <StaffOrdersTable />
      </Suspense>
    </div>
  );
}
