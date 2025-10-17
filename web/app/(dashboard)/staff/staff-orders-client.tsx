'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { getApiBaseUrl, patchJson } from '@/app/lib/api';

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
      const result = await patchJson<UpdateStatusResponse>(
        `${baseUrl}/v1/orders/${orderId}/status`,
        { status: 'fulfilled' },
        { headers: { Authorization: `Bearer ${token}` } }
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
      setOrders(snapshot);
      setError('Unable to update order status. Please try again.');
    } finally {
      setPendingId(null);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="space-y-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <p className="text-sm text-muted-foreground">
          No orders yet. Stripe webhook events will populate this list once the payment flow is connected.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
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
            {orders.map((order) => {
              const fulfilledLabel = order.status === 'fulfilled' ? formatFulfilledAt(order.fulfilledAt) : null;

              return (
                <tr key={order.id}>
                  <td className="px-4 py-3 font-mono text-xs">{order.id}</td>
                  <td className="px-4 py-3">Guest</td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">
                    <div className="flex flex-col">
                      <span>{formatStatus(order.status)}</span>
                      {fulfilledLabel ? (
                        <span className="text-xs text-muted-foreground/80">Served at {fulfilledLabel}</span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link href={`/staff/orders/${order.id}`}>Open</Link>
                      </Button>
                      {order.status === 'paid' ? (
                        <Button
                          size="sm"
                          onClick={() => handleFulfilled(order.id)}
                          disabled={pendingId === order.id}
                        >
                          {pendingId === order.id ? 'Marking…' : 'Mark served'}
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
