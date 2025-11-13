'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { getApiBaseUrl, patchJson } from '@/app/lib/api';
import * as Sentry from '@sentry/nextjs';

export type OrderStatus = 'created' | 'paid' | 'cancelled' | 'fulfilled';

export interface OrderSummary {
  id: string;
  status: OrderStatus;
  createdAt: string;
  fulfilledAt: string | null;
}

interface Props {
  initialOrders: OrderSummary[];
  initialError?: string | null;
}

interface UpdateStatusResponse {
  id: string;
  status: OrderStatus;
  fulfilledAt: string | null;
}

function formatStatus(status: OrderStatus) {
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

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

function formatFulfilledAt(value: string | null) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function StaffOrdersClient({ initialOrders, initialError = null }: Props) {
  const [orders, setOrders] = useState<OrderSummary[]>(initialOrders);
  const [error, setError] = useState<string | null>(initialError);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const baseUrl = useMemo(() => getApiBaseUrl(), []);
  const { data: session } = useSession();

  const handleFulfilled = async (orderId: string) => {
    if (!window.confirm('Mark this order as served?')) {
      return;
    }

    const token = session?.apiToken;
    if (!token) {
      setError('Session expired. Please refresh the page to sign in again.');
      return;
    }

    const snapshot = orders.map((order) => ({ ...order }));
    const optimisticTimestamp = new Date().toISOString();

    setPendingId(orderId);
    setError(null);
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? { ...order, status: 'fulfilled', fulfilledAt: optimisticTimestamp }
          : order
      )
    );

    try {
      const result = await Sentry.startSpan({ name: 'orders.fulfill', op: 'ui.action' }, () =>
        patchJson<UpdateStatusResponse>(
          `${baseUrl}/v1/orders/${orderId}/status`,
          { status: 'fulfilled' },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: result.status,
                fulfilledAt: result.fulfilledAt
              }
            : order
        )
      );
    } catch (err) {
      Sentry.captureException(err);
      setOrders(snapshot);
      setError('Unable to update order status. Please try again.');
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No orders yet. Stripe webhook events will populate this list once the payment flow is connected.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => {
            const fulfilledLabel = order.status === 'fulfilled' ? formatFulfilledAt(order.fulfilledAt) : null;
            const isPending = pendingId === order.id;

            return (
              <div
                key={order.id}
                className="flex h-full flex-col justify-between rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="font-mono">{order.id}</span>
                    <span>{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Custom cocktail</p>
                    <p className="text-xs text-muted-foreground">Guest order</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide">
                    <span className="rounded-full bg-primary/15 px-2 py-1 font-medium text-primary">
                      {formatStatus(order.status)}
                    </span>
                    {fulfilledLabel ? (
                      <span className="text-muted-foreground">Served {fulfilledLabel}</span>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/staff/orders/${order.id}`}>View recipe</Link>
                  </Button>
                  {order.status === 'paid' ? (
                    <Button size="sm" onClick={() => handleFulfilled(order.id)} disabled={isPending}>
                      {isPending ? 'Marking…' : 'Mark served'}
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Awaiting payment</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
