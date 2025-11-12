import { notFound, redirect } from 'next/navigation';
import { apiFetch, getApiBaseUrl } from '@/app/lib/api';
<<<<<<< HEAD
import StaffOrderDetailClient from '../order-detail-client';
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";

=======
import { auth } from '@/auth';
import StaffOrderDetailClient from './order-detail-client';
>>>>>>> pr-22

interface OrderPageProps {
  params: { orderId: string };
}

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

export default async function StaffOrderDetailPage({ params }: OrderPageProps) {
<<<<<<< HEAD
  const session = await getServerSession(authOptions);
=======
  const session = await auth();
>>>>>>> pr-22

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
