import { notFound } from 'next/navigation';
import { getApiBaseUrl } from '@/app/lib/api';
import StaffOrderDetailClient from './order-detail-client';

interface OrderPageProps {
  params: { orderId: string };
}

async function fetchOrder(orderId: string) {
  const baseUrl = getApiBaseUrl();
  const res = await fetch(`${baseUrl}/v1/orders/${orderId}/recipe`, { cache: 'no-store' });

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

export default async function StaffOrderDetailPage({ params }: OrderPageProps) {
  const { orderId } = params;
  const order = await fetchOrder(orderId);

  return <StaffOrderDetailClient initialOrder={order} />;
}
