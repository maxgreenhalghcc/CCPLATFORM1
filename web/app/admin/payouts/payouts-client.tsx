'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getApiBaseUrl } from '@/app/lib/api';

interface PayoutRecord {
  id: string;
  barId: string;
  barName: string;
  weekStart: string;
  fulfilledCount: number;
  tierName: string | null;
  payoutAmount: number;
  payoutStatus: 'PENDING' | 'PAID';
  paidAt: string | null;
}

interface Props {
  initialPayouts: PayoutRecord[];
  token: string;
}

export default function PayoutsClient({ initialPayouts, token }: Props) {
  const base = getApiBaseUrl();
  const [payouts, setPayouts] = useState<PayoutRecord[]>(initialPayouts);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'PAID'>('ALL');
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = payouts.filter(
    (p) => statusFilter === 'ALL' || p.payoutStatus === statusFilter,
  );

  const totalPending = payouts
    .filter((p) => p.payoutStatus === 'PENDING')
    .reduce((sum, p) => sum + p.payoutAmount, 0);

  async function markPaid(id: string) {
    setError(null);
    setMarkingId(id);
    try {
      const res = await fetch(`${base}/v1/admin/payouts/${id}`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const updated = await res.json() as { id: string; payoutStatus: string; paidAt: string | null };
      setPayouts((prev) =>
        prev.map((p) =>
          p.id === updated.id
            ? { ...p, payoutStatus: updated.payoutStatus as 'PAID', paidAt: updated.paidAt }
            : p,
        ),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as paid');
    } finally {
      setMarkingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Summary */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="rounded-xl bg-amber-500/10 px-5 py-3 ring-1 ring-amber-500/20">
          <p className="text-xs text-amber-400/80">Total pending</p>
          <p className="text-2xl font-bold text-amber-400">£{totalPending.toFixed(2)}</p>
        </div>

        {/* Filter */}
        <div className="ml-auto flex items-center gap-2 rounded-full border border-border p-1">
          {(['ALL', 'PENDING', 'PAID'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
                statusFilter === f
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {f === 'ALL' ? 'All' : f === 'PENDING' ? 'Pending' : 'Paid'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive ring-1 ring-destructive/20">
          {error}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payouts match this filter.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border/[var(--border-alpha,0.5)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/[var(--border-alpha,0.5)] bg-card/40">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Bar</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Week</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Fulfilled</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tier</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Amount</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-border/[var(--border-alpha,0.5)] last:border-0 hover:bg-card/30"
                >
                  <td className="px-4 py-3 font-medium">{p.barName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatWeek(p.weekStart)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{p.fulfilledCount}</td>
                  <td className="px-4 py-3">
                    {p.tierName ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary ring-1 ring-primary/20">
                        {p.tierName}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    £{p.payoutAmount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${
                        p.payoutStatus === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 ring-amber-500/20'
                      }`}
                    >
                      {p.payoutStatus === 'PAID'
                        ? `Paid ${p.paidAt ? new Date(p.paidAt).toLocaleDateString('en-GB') : ''}`
                        : 'Pending'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.payoutStatus === 'PENDING' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markPaid(p.id)}
                        disabled={markingId === p.id}
                      >
                        {markingId === p.id ? 'Marking…' : 'Mark paid'}
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatWeek(weekStart: string): string {
  const d = new Date(weekStart);
  const end = new Date(d);
  end.setDate(end.getDate() + 6);
  const fmt = (date: Date) =>
    date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${fmt(d)} – ${fmt(end)}`;
}
