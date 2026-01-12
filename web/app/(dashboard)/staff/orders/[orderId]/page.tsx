import { notFound, redirect } from 'next/navigation';
import { apiFetch, getApiBaseUrl } from '@/app/lib/api';
import { auth } from '@/auth';
import StaffOrderDetailClient from './order-detail-client';
import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';


interface OrderPageProps {
  params: { orderId: string };
}
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

function parseQuizAnswerChoice(raw: Prisma.JsonValue | null | undefined): string | null {
  if (raw == null) return null;

  // If Prisma gives us an object already, use it directly.
  // If it's a string, it might be JSON stringified (legacy), so attempt JSON.parse.
  try {
    const parsed =
      typeof raw === 'string'
        ? (JSON.parse(raw) as any)
        : (raw as any);

    if (typeof parsed?.choice === 'string') return parsed.choice.trim() || null;
    if (typeof parsed?.text === 'string') return parsed.text.trim() || null;
    if (typeof parsed?.value === 'string') return parsed.value.trim() || null;

    // If it's just a plain string
    if (typeof parsed === 'string') return parsed.trim() || null;

    // Last resort: stringify objects/numbers/booleans so staff can still see what was sent
    return String(typeof raw === 'string' ? raw : JSON.stringify(raw)).trim() || null;
  } catch {
    // If raw is not JSON parseable, just coerce to string
    return String(raw).trim() || null;
  }
}

async function fetchOrder(orderId: string, token?: string) {
  const baseUrl = getApiBaseUrl();

  const res = await apiFetch(`${baseUrl}/v1/orders/${orderId}/recipe`, {
    cache: 'no-store',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
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

  const ingredients = Array.isArray(payload.ingredients)
    ? payload.ingredients
    : [];

  const warnings = Array.isArray(payload.warnings)
    ? (payload.warnings as string[])
    : [];
  // --- Pull verbatim allergens from quiz answers (does NOT affect recipe payload) ---
  let allergensRaw: string | null = null;

  try {
    const dbOrder = await prisma.order.findUnique({
      where: { id: payload.orderId ?? orderId },
      select: { sessionId: true },
    });

    if (dbOrder?.sessionId) {
      const allergensAnswer = await prisma.quizAnswer.findFirst({
        where: { sessionId: dbOrder.sessionId, questionId: 'allergens' },
        select: { value: true },
      });

      allergensRaw = parseQuizAnswerChoice(allergensAnswer?.value);
    }
  } catch (err) {
    // Never break the page if DB lookup fails
    console.error('Unable to load allergens for order', payload.orderId ?? orderId, err);
  }

  return {
    orderId: payload.orderId ?? orderId,
    status: (payload.status ?? 'created') as
      | 'created'
      | 'paid'
      | 'cancelled'
      | 'fulfilled',
    fulfilledAt: payload.fulfilledAt ?? null,
    allergensRaw,
    recipe: {
      name: payload.name ?? 'Custom cocktail',
      description: payload.description ?? '',
      ingredients,
      method: payload.method ?? '',
      glassware: payload.glassware ?? '',
      garnish: payload.garnish ?? '',
      warnings,
    },
  };
}

export default async function StaffOrderDetailPage({ params }: OrderPageProps) {
  const session = await auth();

  // Not logged in or not staff → send to login with callback back to this order
  if (!session || session.user.role !== 'staff') {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(
        `/staff/orders/${params.orderId}`,
      )}`,
    );
  }

  const { orderId } = params;

  try {
    const order = await fetchOrder(orderId, session.apiToken);
    return <StaffOrderDetailClient initialOrder={order} />;
  } catch (error) {
    // If anything goes wrong loading the order, bounce back to /staff
    redirect('/staff');
  }
}
