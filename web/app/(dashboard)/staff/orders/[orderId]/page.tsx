import { notFound, redirect } from 'next/navigation';
import { apiFetch, getApiBaseUrl } from '@/app/lib/api';
import { auth } from '@/auth';
import StaffOrderDetailClient from './order-detail-client';

interface OrderPageProps {
  params: { orderId: string };
}

/**
 * Fetches and normalizes an order's recipe and metadata for the given order ID.
 *
 * @param orderId - The order identifier to fetch.
 * @param token - Optional API bearer token used for the Authorization header.
 * @returns An object with:
 *  - `orderId`: the returned order id or the provided `orderId` if absent,
 *  - `status`: one of `"created" | "paid" | "cancelled" | "fulfilled"`,
 *  - `fulfilledAt`: a timestamp string or `null`,
 *  - `recipe`: an object containing `name`, `description`, `ingredients` (array of `{ name?: string; amount?: string }`), `method`, `glassware`, `garnish`, and `warnings` (string[]).
 *
 * Observables:
 *  - Invokes `notFound()` if the API responds with HTTP 404.
 *  - Throws `Error('Unable to load order')` for other non-OK HTTP responses.
 */
async function fetchOrder(orderId: string, token?: string) {
  const baseUrl = getApiBaseUrl();
  const res = await apiFetch(`${baseUrl}/v1/orders/${orderId}/recipe`, {
    cache: 'no-store',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });

  if (res.status === 404) {
    notFound();
  }

  if (!res.ok) {
    throw new Error('Unable to load order');
  }

  const payload = (await res.json()) as {
    orderId?: string;
    status?: string;
    fulfilledAt?: string | null;
    name?: string;
    description?: string | null;
    ingredients?: Array<{ name?: string; amount?: string }>;
    method?: string;
    glassware?: string;
    garnish?: string;
    warnings?: unknown;
  };

  const ingredients = Array.isArray(payload.ingredients) ? payload.ingredients : [];
  const warnings = Array.isArray(payload.warnings)
    ? (payload.warnings as string[])
    : [];

  return {
    orderId: payload.orderId ?? orderId,
    status: (payload.status ?? 'created') as 'created' | 'paid' | 'cancelled' | 'fulfilled',
    fulfilledAt: payload.fulfilledAt ?? null,
    recipe: {
      name: payload.name ?? 'Custom cocktail',
      description: payload.description ?? '',
      ingredients,
      method: payload.method ?? '',
      glassware: payload.glassware ?? '',
      garnish: payload.garnish ?? '',
      warnings
    }
  };
}

/**
 * Server page component that verifies staff access, fetches an order, and renders the staff order detail client.
 *
 * If there is no active staff session the user is redirected to the login page with a callback back to this order.
 * If fetching the order fails, the user is redirected to the staff overview page.
 *
 * @param params - Route parameters containing `orderId`, the ID of the order to fetch and display
 * @returns The StaffOrderDetailClient React element initialized with the fetched order data
 */
export default async function StaffOrderDetailPage({ params }: OrderPageProps) {
  const session = await auth();

  if (!session || session.user.role !== 'staff') {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/staff/orders/${params.orderId}`)}`);
  }

  const { orderId } = params;
  try {
    const order = await fetchOrder(orderId, session.apiToken);
    return <StaffOrderDetailClient initialOrder={order} />;
  } catch (error) {
    redirect('/staff');
  }
}