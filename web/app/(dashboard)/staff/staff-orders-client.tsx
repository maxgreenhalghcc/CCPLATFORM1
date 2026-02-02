'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { getApiBaseUrl, patchJson } from '@/app/lib/api';
import * as Sentry from '@sentry/nextjs';
import { toast } from 'sonner';

export type OrderStatus = 'created' | 'paid' | 'making' | 'cancelled' | 'fulfilled';

export interface OrderSummary {
  id: string;
  status: OrderStatus;
  createdAt: string;
  claimedAt: string | null;
  claimedBy: string | null;
  fulfilledAt: string | null;
  recipeName: string;
}

interface Props {
  initialOrders: OrderSummary[];
  initialError?: string | null;
}

interface UpdateStatusResponse {
  id: string;
  status: OrderStatus;
  claimedAt: string | null;
  claimedBy: string | null;
  fulfilledAt: string | null;
}

function formatStatus(status: OrderStatus) {
  switch (status) {
    case 'created':
      return 'Awaiting payment';
    case 'paid':
      return 'Ready to mix';
    case 'making':
      return 'Making';
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
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'making' | 'served'>('all');

  const baseUrl = useMemo(() => getApiBaseUrl(), []);
  const { data: session } = useSession();

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders;
    if (filter === 'pending') return orders.filter(o => o.status === 'created');
    if (filter === 'paid') return orders.filter(o => o.status === 'paid');
    if (filter === 'making') return orders.filter(o => o.status === 'making');
    if (filter === 'served') return orders.filter(o => o.status === 'fulfilled');
    return orders;
  }, [orders, filter]);

  const counts = useMemo(() => ({
    all: orders.length,
    pending: orders.filter(o => o.status === 'created').length,
    paid: orders.filter(o => o.status === 'paid').length,
    making: orders.filter(o => o.status === 'making').length,
    served: orders.filter(o => o.status === 'fulfilled').length,
  }), [orders]);

  const [isPolling, setIsPolling] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [soundEnabled, setSoundEnabled] = useState(false);
  const previousOrderIdsRef = useRef<Set<string>>(new Set(initialOrders.map(o => o.id)));

  const refreshOrders = useCallback(async () => {
    const token = session?.apiToken;
    if (!token) return;

    try {
      const barId = session.user?.barId ?? 'demo-bar';
      const res = await fetch(`${baseUrl}/v1/bars/${barId}/orders`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      });

      if (!res.ok) {
        throw new Error('Failed to refresh orders');
      }

      const payload = await res.json() as {
        items: Array<{
          id: string;
          status: OrderStatus;
          createdAt: string;
          fulfilledAt?: string | null;
          recipeName?: string | null;
        }>;
      };

      const refreshed: OrderSummary[] = payload.items.map((item) => ({
        ...item,
        fulfilledAt: item.fulfilledAt ?? null,
        recipeName: item.recipeName ?? 'Custom cocktail',
      }));

      // Detect new orders
      const currentIds = new Set(refreshed.map(o => o.id));
      const newOrders = refreshed.filter(o => !previousOrderIdsRef.current.has(o.id));
      
      if (newOrders.length > 0) {
        // Show toast for new orders
        newOrders.forEach(order => {
          const statusLabel = order.status === 'paid' ? '💳 Ready to mix' : '⏳ Awaiting payment';
          toast.success(`New order: ${order.recipeName}`, {
            description: statusLabel,
            duration: 5000,
          });
        });

        // Play sound if enabled
        if (soundEnabled) {
          try {
            const audio = new Audio('/sounds/notification.mp3');
            void audio.play().catch(() => {
              // Silent fail if sound can't play (e.g., no interaction yet)
            });
          } catch {
            // Silent fail
          }
        }
      }

      previousOrderIdsRef.current = currentIds;
      setOrders(refreshed);
      setLastRefreshed(new Date());
      setError(null);
    } catch (err) {
      Sentry.captureException(err);
      // Silent fail on polling errors (don't replace orders with empty state)
    }
  }, [session, baseUrl]);

  // Auto-refresh every 30 seconds when polling is enabled
  useEffect(() => {
    if (!isPolling) return;

    const interval = setInterval(() => {
      void refreshOrders();
    }, 30000);

    return () => clearInterval(interval);
  }, [isPolling, refreshOrders]);

  const handleClaim = async (orderId: string) => {
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
          ? { ...order, status: 'making', claimedAt: optimisticTimestamp, claimedBy: session?.user?.name ?? 'You' }
          : order
      )
    );

    try {
      const result = await Sentry.startSpan({ name: 'orders.claim', op: 'ui.action' }, () =>
        patchJson<UpdateStatusResponse>(
          `${baseUrl}/v1/orders/${orderId}/status`,
          { status: 'making' },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      );

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: result.status,
                claimedAt: result.claimedAt,
                claimedBy: result.claimedBy,
                fulfilledAt: result.fulfilledAt
              }
            : order
        )
      );
    } catch (err) {
      Sentry.captureException(err);
      setOrders(snapshot);
      setError('Unable to claim order. Please try again.');
    } finally {
      setPendingId(null);
    }
  };

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
                claimedAt: result.claimedAt,
                claimedBy: result.claimedBy,
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
    <div className="space-y-6">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {/* Polling controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/50 bg-card/50 p-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => void refreshOrders()}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium transition hover:bg-accent"
          >
            Refresh now
          </button>
          <button
            onClick={() => setIsPolling(!isPolling)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              isPolling
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'border-border bg-background hover:bg-accent'
            }`}
          >
            {isPolling ? '● Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
              soundEnabled
                ? 'border-primary/50 bg-primary/10 text-primary'
                : 'border-border bg-background hover:bg-accent'
            }`}
            title={soundEnabled ? 'Sound notifications enabled' : 'Sound notifications disabled'}
          >
            {soundEnabled ? '🔔 Sound ON' : '🔕 Sound OFF'}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Last updated: {lastRefreshed.toLocaleTimeString()}
          {isPolling ? ' • refreshing every 30s' : ''}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setFilter('all')}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            filter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'border border-border bg-card text-muted-foreground hover:border-primary/60 hover:text-foreground'
          }`}
        >
          All <span className="ml-1.5 opacity-70">({counts.all})</span>
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            filter === 'pending'
              ? 'bg-primary text-primary-foreground'
              : 'border border-border bg-card text-muted-foreground hover:border-primary/60 hover:text-foreground'
          }`}
        >
          Pending <span className="ml-1.5 opacity-70">({counts.pending})</span>
        </button>
        <button
          onClick={() => setFilter('paid')}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            filter === 'paid'
              ? 'bg-primary text-primary-foreground'
              : 'border border-border bg-card text-muted-foreground hover:border-primary/60 hover:text-foreground'
          }`}
        >
          Ready to mix <span className="ml-1.5 opacity-70">({counts.paid})</span>
        </button>
        <button
          onClick={() => setFilter('making')}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            filter === 'making'
              ? 'bg-primary text-primary-foreground'
              : 'border border-border bg-card text-muted-foreground hover:border-primary/60 hover:text-foreground'
          }`}
        >
          Making <span className="ml-1.5 opacity-70">({counts.making})</span>
        </button>
        <button
          onClick={() => setFilter('served')}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            filter === 'served'
              ? 'bg-primary text-primary-foreground'
              : 'border border-border bg-card text-muted-foreground hover:border-primary/60 hover:text-foreground'
          }`}
        >
          Served <span className="ml-1.5 opacity-70">({counts.served})</span>
        </button>
      </div>

      {orders.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No orders yet. Stripe webhook events will populate this list once the payment flow is connected.
        </p>
      ) : filteredOrders.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No {filter} orders.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredOrders.map((order) => {
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
                    <p className="text-sm font-semibold text-foreground">
                      {order.recipeName || 'Custom cocktail'}
                    </p>
                    <p className="text-xs text-muted-foreground">Guest order</p>
                  </div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-wide">
                    <span className="rounded-full bg-primary/15 px-2 py-1 font-medium text-primary">
                      {formatStatus(order.status)}
                    </span>
                    {fulfilledLabel ? (
                      <span className="text-muted-foreground">Served {fulfilledLabel}</span>
                    ) : null}
                    {order.status === 'making' && order.claimedBy ? (
                      <span className="text-muted-foreground">by {order.claimedBy}</span>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/staff/orders/${order.id}`}>View recipe</Link>
                  </Button>
                  {order.status === 'paid' ? (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => handleClaim(order.id)} disabled={isPending}>
                        {isPending ? 'Claiming…' : 'Claim'}
                      </Button>
                      <Button size="sm" onClick={() => handleFulfilled(order.id)} disabled={isPending}>
                        {isPending ? 'Marking…' : 'Skip to served'}
                      </Button>
                    </div>
                  ) : order.status === 'making' ? (
                    <Button size="sm" onClick={() => handleFulfilled(order.id)} disabled={isPending}>
                      {isPending ? 'Marking…' : 'Mark served'}
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {order.status === 'created' ? 'Awaiting payment' : '—'}
                    </span>
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
