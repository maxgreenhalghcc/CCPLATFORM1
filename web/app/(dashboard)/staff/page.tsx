import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { apiFetch, getApiBaseUrl } from '@/app/lib/api';
import StaffOrdersClient, { type OrderSummary } from './staff-orders-client';

/**
 * Fetches order summaries for a bar and normalizes their fulfilled timestamps.
 *
 * @param token - API bearer token with permission to read the bar's orders
 * @param barIdentifier - Identifier of the bar whose orders should be fetched
 * @returns An array of order summaries; each item includes `id`, `status`, `createdAt`, and `fulfilledAt` (set to `null` when absent)
 * @throws Error('Not authorised to view orders for this bar') when the request is rejected with 401 or 403
 * @throws Error('Unable to load orders') for other non-success HTTP responses
 */
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
    }>;
  };

  return payload.items.map((item) => ({
    ...item,
    fulfilledAt: item.fulfilledAt ?? null
  }));
}

/**
 * Load orders for a bar and render the StaffOrdersClient with the fetched data or an error state.
 *
 * @param token - API token used to authorize the request
 * @param barId - Identifier of the bar whose orders should be loaded
 * @returns A React element that displays the staff orders; if fetching fails, displays an empty order list with an initial error message.
 */
async function StaffOrdersTable({ token, barId }: { token: string; barId: string }) {
  try {
    const orders = await fetchOrders(token, barId);
    return <StaffOrdersClient initialOrders={orders} />;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load orders.';
    return <StaffOrdersClient initialOrders={[]} initialError={message} />;
  }
}

/**
 * Server page that renders the staff orders dashboard and enforces staff authentication.
 *
 * If there is no authenticated staff session the request is redirected to `/login?callbackUrl=/staff`.
 *
 * @returns The JSX element for the staff dashboard page containing the header and the staff orders table.
 * @throws Error if the authenticated session exists but lacks an API token.
 */
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
      </header>
      <Suspense fallback={<p>Loading orders…</p>}>
        {/* @ts-expect-error Async Server Component */}
        <StaffOrdersTable barId={barId} token={session.apiToken} />
      </Suspense>
    </div>
  );
}