'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useSession } from 'next-auth/react';
import { getApiBaseUrl, patchJson } from '@/app/lib/api';
import { AnimatePresence, motion, FadeIn, DURATION, EASE } from '@/app/components/motion';
import * as Sentry from '@sentry/nextjs';
import { toast } from 'sonner';

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
const ACCEPTED_KEY = 'cc.staff.acceptedOrders.v1';

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

function loadAccepted(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(ACCEPTED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v) => typeof v === 'string'));
  } catch {
    return new Set();
  }
}

function saveAccepted(accepted: Set<string>) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ACCEPTED_KEY, JSON.stringify(Array.from(accepted)));
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
  const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'served'>('all');
  const [banner, setBanner] = useState<string | null>(null);

  const baseUrl = useMemo(() => getApiBaseUrl(), []);
  const { data: session } = useSession();

  const filteredOrders = useMemo(() => {
    if (filter === 'all') return orders;
    if (filter === 'pending') return orders.filter(o => o.status === 'created');
    if (filter === 'paid') return orders.filter(o => o.status === 'paid');
    if (filter === 'served') return orders.filter(o => o.status === 'fulfilled');
    return orders;
  }, [orders, filter]);

  const counts = useMemo(() => ({
    all: orders.length,
    pending: orders.filter(o => o.status === 'created').length,
    paid: orders.filter(o => o.status === 'paid').length,
    served: orders.filter(o => o.status === 'fulfilled').length,
  }), [orders]);

  const [isPolling, setIsPolling] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [soundEnabled, setSoundEnabled] = useState(() => loadSoundEnabled());
  const [unread, setUnread] = useState<Set<string>>(() => loadUnread());
  const [accepted, setAccepted] = useState<Set<string>>(() => loadAccepted());
  const previousOrderIdsRef = useRef<Set<string>>(new Set(initialOrders.map(o => o.id)));

  useEffect(() => {
    saveUnread(unread);
  }, [unread]);

  useEffect(() => {
    saveAccepted(accepted);
  }, [accepted]);

  useEffect(() => {
    saveSoundEnabled(soundEnabled);
  }, [soundEnabled]);

  const refreshOrders = useCallback(async () => {
    const token = session?.apiToken;
    if (!token) return;

    try {
      const targetBarId = barId || session.user?.barId || 'demo-bar';
      const res = await fetch(`${baseUrl}/v1/bars/${targetBarId}/orders`, {
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
        // Mark paid orders as unread for attention
        setUnread((current) => {
          const next = new Set(current);
          newOrders.forEach((order) => {
            if (order.status === 'paid' && !accepted.has(order.id)) {
              next.add(order.id);
            }
          });
          return next;
        });

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

      // Clean up unread set: keep only PAID orders that still exist and aren't accepted on this device
      setUnread((current) => {
        const next = new Set<string>();
        refreshed.forEach((order) => {
          if (order.status === 'paid' && current.has(order.id) && !accepted.has(order.id)) {
            next.add(order.id);
          }
        });
        return next;
      });

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

  const needsAttentionCount = useMemo(() => {
    return orders.filter((o) => o.status === 'paid' && unread.has(o.id) && !accepted.has(o.id)).length;
  }, [orders, unread, accepted]);

  // Loop sound until orders are accepted (device-local)
  useEffect(() => {
    if (!soundEnabled) return;
    if (needsAttentionCount <= 0) return;

    const interval = window.setInterval(() => {
      // repeat alert while there are unseen paid orders
      playNotificationBeep();
      try {
        const audio = new Audio('/sounds/notification.mp3');
        void audio.play().catch(() => {
          // ignore
        });
      } catch {
        // ignore
      }
    }, 10000);

    return () => window.clearInterval(interval);
  }, [soundEnabled, needsAttentionCount]);

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

  const markRead = useCallback((orderId: string) => {
    setUnread((current) => {
      const next = new Set(current);
      next.delete(orderId);
      return next;
    });
  }, []);

  const acceptOrder = useCallback((orderId: string) => {
    // Device-local accept: stops sound + clears unread without needing a DB change.
    setAccepted((current) => {
      const next = new Set(current);
      next.add(orderId);
      return next;
    });
    setUnread((current) => {
      const next = new Set(current);
      next.delete(orderId);
      return next;
    });
  }, []);

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
  const testSound = () => {
    // Needs user gesture in most browsers; this button provides it.
    playNotificationBeep();
    try {
      const audio = new Audio('/sounds/notification.mp3');
      void audio.play().catch(() => {
        // ignore
      });
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      {banner ? <p className="text-sm text-muted-foreground">{banner}</p> : null}
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
          <button
            onClick={testSound}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-medium transition hover:bg-accent"
          >
            Test sound
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
        <FadeIn>
          <p className="text-sm text-muted-foreground">
            No orders yet. Stripe webhook events will populate this list once the payment flow is connected.
          </p>
        </FadeIn>
      ) : filteredOrders.length === 0 ? (
        <FadeIn>
          <p className="text-sm text-muted-foreground">
            No {filter} orders.
          </p>
        </FadeIn>
      ) : (
        <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredOrders.map((order, index) => {
              const fulfilledLabel = order.status === 'fulfilled' ? formatFulfilledAt(order.fulfilledAt) : null;
              const isPending = pendingId === order.id;
              const isUnread = unread.has(order.id) && order.status === 'paid';

              return (
                <motion.div
                  key={order.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96, y: 12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: DURATION.normal, delay: index < 12 ? index * 0.04 : 0, ease: EASE.out }}
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
                        <span className="animate-badge-pulse rounded-full bg-amber-500/20 px-2 py-1 text-[10px] font-semibold tracking-wide text-amber-700">
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
                      <div className="flex items-center gap-2">
                        {isUnread && !accepted.has(order.id) ? (
                          <Button size="sm" onClick={() => acceptOrder(order.id)} variant="default">
                            Accept
                          </Button>
                        ) : null}
                        <Button size="sm" onClick={() => handleFulfilled(order.id)} disabled={isPending}>
                          {isPending ? 'Marking…' : 'Mark served'}
                        </Button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Awaiting payment</span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
}
