'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { getApiBaseUrl, patchJson } from '@/app/lib/api';
import { useSession } from 'next-auth/react';
import type { OrderStatus } from '../../staff-orders-client';
import * as Sentry from '@sentry/nextjs';

interface IngredientEntry {
  name?: string;
  amount?: string;
}

interface RecipePayload {
  name: string;
  description: string;
  ingredients: IngredientEntry[];
  method: string;
  glassware: string;
  garnish: string;
  warnings: string[];
}

interface OrderDetailProps {
  initialOrder: {
    orderId: string;
    status: OrderStatus;
    fulfilledAt: string | null;
    recipe: RecipePayload;
  };
}

interface UpdateStatusResponse {
  id: string;
  status: OrderStatus;
  fulfilledAt: string | null;
}

function formatStatusLabel(status: OrderStatus) {
  switch (status) {
    case 'created':
      return 'Awaiting payment';
    case 'paid':
      return 'Ready to mix';
    case 'fulfilled':
      return 'Served';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status;
  }
}

function normalizeIngredient(entry: IngredientEntry) {
  const name = entry.name?.trim() ?? '';
  const amount = entry.amount?.trim() ?? '';

  // Drop completely empty rows from the UI
  if (!name && !amount) {
    return null;
  }

  return {
    name: name || 'Ingredient',
    amount,
  };
}

function formatFulfilledAt(value: string | null) {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function StaffOrderDetailClient({ initialOrder }: OrderDetailProps) {
  const [status, setStatus] = useState<OrderStatus>(initialOrder.status);
  const [fulfilledAt, setFulfilledAt] = useState<string | null>(initialOrder.fulfilledAt);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const baseUrl = useMemo(() => getApiBaseUrl(), []);
  const { data: session } = useSession();

  const markServed = async () => {
    if (!window.confirm('Confirm this cocktail has been served?')) {
      return;
    }

    const token = session?.apiToken;
    if (!token) {
      setError('Session expired. Please refresh the page to sign in again.');
      return;
    }

    const previousStatus = status;
    const previousFulfilled = fulfilledAt;
    const optimisticTimestamp = new Date().toISOString();

    setPending(true);
    setError(null);
    setStatus('fulfilled');
    setFulfilledAt(optimisticTimestamp);

    try {
      const result = await Sentry.startSpan(
        { name: 'orders.fulfill', op: 'ui.action' },
        () =>
          patchJson<UpdateStatusResponse>(
            `${baseUrl}/v1/orders/${initialOrder.orderId}/status`,
            { status: 'fulfilled' },
            { headers: { Authorization: `Bearer ${token}` } },
          ),
      );

      setStatus(result.status);
      setFulfilledAt(result.fulfilledAt);
    } catch (err) {
      Sentry.captureException(err);
      setStatus(previousStatus);
      setFulfilledAt(previousFulfilled);
      setError('Unable to update the order. Please try again.');
    } finally {
      setPending(false);
    }
  };

  const servedLabel = formatFulfilledAt(fulfilledAt);
  const normalizedIngredients = initialOrder.recipe.ingredients
    .map(normalizeIngredient)
    .filter((entry): entry is { name: string; amount: string } => Boolean(entry));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-16">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Order #{initialOrder.orderId}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold leading-tight">
            {initialOrder.recipe.name}
          </h1>
          <span className="rounded-full border border-border/60 bg-card px-3 py-1 text-xs capitalize text-muted-foreground">
            {formatStatusLabel(status)}
          </span>
        </div>

        {status === 'fulfilled' && servedLabel ? (
          <p className="text-sm text-muted-foreground">Served at {servedLabel}</p>
        ) : null}

        {status === 'paid' ? (
          <div>
            <Button onClick={markServed} disabled={pending}>
              {pending ? 'Marking…' : 'Mark served'}
            </Button>
          </div>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </header>

      <section className="space-y-6 rounded-2xl border bg-card p-6 shadow-sm">
        <div>
          <h2 className="text-xl font-semibold">Ingredients</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {normalizedIngredients.length > 0 ? (
              normalizedIngredients.map((ingredient) => (
                <li
                  className="flex items-center justify-between"
                  key={`${ingredient.name}-${ingredient.amount}`}
                >
                  <span>{ingredient.name}</span>
                  {ingredient.amount ? (
                    <span className="font-mono text-xs text-muted-foreground">
                      {ingredient.amount}
                    </span>
                  ) : null}
                </li>
              ))
            ) : (
              <li className="text-muted-foreground">
                Ingredients will be confirmed at the bar.
              </li>
            )}
          </ul>
        </div>

        <div className="space-y-4 text-sm text-muted-foreground">
          <p>
            <strong>Method:</strong>{' '}
            {initialOrder.recipe.method
              ? initialOrder.recipe.method
              : 'Refer to the recipe engine output.'}
          </p>
          <p>
            <strong>Glassware:</strong>{' '}
            {initialOrder.recipe.glassware || "Bartender's choice"}
          </p>
          <p>
            <strong>Garnish:</strong>{' '}
            {initialOrder.recipe.garnish || 'To be decided by staff'}
          </p>
        </div>
      </section>
    </div>
  );
}
