import { Suspense } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { buildGuardHeaders, getApiBaseUrl } from '@/app/lib/api';

type OrderStatus = 'created' | 'paid' | 'cancelled';

interface OrderSummary {
  id: string;
  status: OrderStatus;
  createdAt: string;
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
  const payload = (await res.json()) as { items: OrderSummary[] };
  return payload.items;
}

function formatStatus(status: OrderStatus) {
  switch (status) {
    case 'created':
      return 'Awaiting payment';
    case 'paid':
      return 'Ready to mix';
    case 'cancelled':
      return 'Cancelled';
  }
}

async function StaffOrdersTable() {
  const orders = await fetchOrders();

  if (orders.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No orders yet. Stripe webhook events will populate this list once the payment flow is connected.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border">
      <table className="min-w-full divide-y divide-border text-left text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-4 py-3 font-semibold">Order ID</th>
            <th className="px-4 py-3 font-semibold">Customer</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Created</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border bg-card">
          {orders.map((order) => (
            <tr key={order.id}>
              <td className="px-4 py-3 font-mono text-xs">{order.id}</td>
              <td className="px-4 py-3">Guest</td>
              <td className="px-4 py-3 capitalize text-muted-foreground">{formatStatus(order.status)}</td>
              <td className="px-4 py-3">{new Date(order.createdAt).toLocaleString()}</td>
              <td className="px-4 py-3 text-right">
                <Button asChild size="sm">
                  <Link href={`/staff/orders/${order.id}`}>Open</Link>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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
