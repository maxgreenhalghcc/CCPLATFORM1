'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
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
  recipeName: string;
}

interface Props {
  barId: string;
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

const UNREAD_KEY = 'cc.staff.unreadOrders.v1';
const SOUND_KEY = 'cc.staff.soundEnabled.v1';

function loadUnread(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(UNREAD_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v) => typeof v === 'string'));
  } catch {
    return new Set();
  }
}

function saveUnread(unread: Set<string>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(UNREAD_KEY, JSON.stringify(Array.from(unread)));
}

function loadSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(SOUND_KEY) === 'true';
  } catch {
    return false;
  }
}

function saveSoundEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SOUND_KEY, enabled ? 'true' : 'false');
}

function playNotificationBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = 880;
    g.gain.value = 0.001;
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    o.stop(ctx.currentTime + 0.2);
    o.onended = () => ctx.close();
  } catch {
    // Ignore (audio may be blocked until user gesture)
  }
}

export default function StaffOrdersClient({ barId, initialOrders, initialError = null }: Props) {
  const [orders, setOrders] = useState<OrderSummary[]>(initialOrders);
  const [error, setError] = useState<string | null>(initialError);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [unread, setUnread] = useState<Set<string>>(() => loadUnread());
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => loadSoundEnabled());

  const baseUrl = useMemo(() => getApiBaseUrl(), []);
  const { data: session } = useSession();

  const pollTimer = useRef<number | null>(null);
  const lastSeenRef = useRef<Map<string, OrderStatus>>(new Map(initialOrders.map((o) => [o.id, o.status])));
  const unreadRef = useRef<Set<string>>(unread);

  useEffect(() => {
    unreadRef.current = unread;
    // Persist unread set whenever it changes.
    saveUnread(unread);
  }, [unread]);

  useEffect(() => {
    saveSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const count = unread.size;
    document.title = count > 0 ? `(${count}) Staff orders` : 'Staff orders';
  }, [unread]);

  useEffect(() => {
    const token = session?.apiToken;
    if (!token) return;

    async function pollOnce() {
      try {
        const res = await fetch(`${baseUrl}/v1/bars/${barId}/orders`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store'
        });

        if (!res.ok) {
          // Don't spam banners for transient auth/network issues.
          return;
        }

        const payload = (await res.json()) as {
          items: Array<{
            id: string;
            status: OrderStatus;
            createdAt: string;
            fulfilledAt?: string | null;
            recipeName?: string | null;
          }>;
        };

        const nextOrders: OrderSummary[] = payload.items.map((item) => ({
          id: item.id,
          status: item.status,
          createdAt: item.createdAt,
          fulfilledAt: item.fulfilledAt ?? null,
          recipeName: item.recipeName ?? 'Custom cocktail'
        }));

        // Detect new/updated orders.
        const lastSeen = lastSeenRef.current;
        const nextUnread = new Set(unreadRef.current);
        let notified = 0;

        for (const o of nextOrders) {
          const previous = lastSeen.get(o.id);
          lastSeen.set(o.id, o.status);

          const becamePayable = o.status === 'paid' && previous !== 'paid';
          if (becamePayable) {
            nextUnread.add(o.id);
            notified += 1;
          }
        }

        lastSeenRef.current = lastSeen;
        setOrders(nextOrders);

        if (nextUnread.size !== unreadRef.current.size) {
          setUnread(nextUnread);
        }

        if (notified > 0) {
          setBanner(notified === 1 ? 'New paid order received.' : `${notified} new paid orders received.`);

          if (soundEnabled) {
            playNotificationBeep();
          }

          if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'granted') {
              new Notification('New paid order', {
                body: 'A guest payment cleared. Open Staff orders to view the recipe.'
              });
            }
          }
        }
      } catch (err) {
        // Swallow polling errors.
      }
    }

    pollOnce();
    pollTimer.current = window.setInterval(pollOnce, 8000);

    return () => {
      if (pollTimer.current) {
        window.clearInterval(pollTimer.current);
      }
    };
  }, [barId, baseUrl, session?.apiToken, soundEnabled]);

  const markRead = (orderId: string) => {
    setUnread((current) => {
      if (!current.has(orderId)) return current;
      const next = new Set(current);
      next.delete(orderId);
      return next;
    });
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

  const unreadCount = unread.size;

  const requestBrowserNotifications = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setBanner('Browser notifications are not supported in this browser.');
      return;
    }

    if (Notification.permission === 'granted') {
      setBanner('Browser notifications are already enabled.');
      return;
    }

    const permission = await Notification.requestPermission();
    setBanner(permission === 'granted' ? 'Browser notifications enabled.' : 'Browser notifications blocked.');
  };

  return (
    <div className="space-y-4">
      {banner ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-card/80 p-4 text-sm">
          <div className="flex items-start justify-between gap-3">
            <p className="text-foreground">{banner}</p>
            <button
              className="text-xs text-muted-foreground underline"
              type="button"
              onClick={() => setBanner(null)}
            >
              Dismiss
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={soundEnabled ? 'default' : 'secondary'}
              type="button"
              onClick={() => setSoundEnabled((v) => !v)}
            >
              {soundEnabled ? 'Sound: on' : 'Sound: off'}
            </Button>
            <Button size="sm" variant="secondary" type="button" onClick={requestBrowserNotifications}>
              Enable browser notifications
            </Button>
            {unreadCount > 0 ? (
              <span className="text-xs text-muted-foreground">Unread paid orders: {unreadCount}</span>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={soundEnabled ? 'default' : 'secondary'}
            type="button"
            onClick={() => setSoundEnabled((v) => !v)}
          >
            {soundEnabled ? 'Sound: on' : 'Sound: off'}
          </Button>
          <Button size="sm" variant="secondary" type="button" onClick={requestBrowserNotifications}>
            Enable browser notifications
          </Button>
          {unreadCount > 0 ? (
            <span className="text-xs text-muted-foreground">Unread paid orders: {unreadCount}</span>
          ) : null}
        </div>
      )}

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
            const isUnread = unread.has(order.id) && order.status === 'paid';

            return (
              <div
                key={order.id}
                className={`flex h-full flex-col justify-between rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm ${
                  isUnread ? 'ring-2 ring-primary/40' : ''
                }`}
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
                  <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide">
                    <span className="rounded-full bg-primary/15 px-2 py-1 font-medium text-primary">
                      {formatStatus(order.status)}
                    </span>
                    {isUnread ? (
                      <span className="rounded-full bg-amber-500/20 px-2 py-1 text-[10px] font-semibold tracking-wide text-amber-700">
                        Unread
                      </span>
                    ) : null}
                    {fulfilledLabel ? (
                      <span className="text-muted-foreground">Served {fulfilledLabel}</span>
                    ) : null}
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <Button asChild size="sm" variant="secondary">
                    <Link href={`/staff/orders/${order.id}`} onClick={() => markRead(order.id)}>
                      View recipe
                    </Link>
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
