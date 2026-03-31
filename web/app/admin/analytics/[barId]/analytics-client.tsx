'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getApiBaseUrl } from '@/app/lib/api';

interface FunnelStep {
  eventType: string;
  count: number;
  conversionRate: number | null;
}

interface FunnelData {
  barId: string;
  from: string;
  to: string;
  steps: FunnelStep[];
}

const EVENT_LABELS: Record<string, string> = {
  PAGE_LOAD: 'Page loads',
  QUIZ_START: 'Quiz starts',
  QUIZ_COMPLETE: 'Quiz completions',
  ORDER_CREATED: 'Orders created',
  ORDER_PAID: 'Orders paid',
  ORDER_FULFILLED: 'Orders fulfilled',
};

interface Props {
  barId: string;
  barName: string;
  token: string;
}

function isoDate(d: Date) {
  return d.toISOString().split('T')[0];
}

export default function AnalyticsClient({ barId, barName, token }: Props) {
  const base = getApiBaseUrl();

  const defaultTo = isoDate(new Date());
  const defaultFrom = isoDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

  const [from, setFrom] = useState(defaultFrom);
  const [to, setTo] = useState(defaultTo);
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(
        `${base}/v1/admin/bars/${barId}/funnel?from=${from}&to=${to}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      setData(await res.json());
      setLoaded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load funnel data');
    } finally {
      setLoading(false);
    }
  }

  const maxCount = data ? Math.max(...data.steps.map((s) => s.count), 1) : 1;

  return (
    <div className="flex flex-col gap-6">
      {/* Date range picker */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">From</label>
          <input
            type="date"
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">To</label>
          <input
            type="date"
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={load} disabled={loading}>
          {loading ? 'Loading…' : loaded ? 'Refresh' : 'Load funnel'}
        </Button>
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive ring-1 ring-destructive/20">
          {error}
        </p>
      )}

      {!loaded && !loading && (
        <p className="text-sm text-muted-foreground">
          Select a date range and click &quot;Load funnel&quot; to view conversion data for {barName}.
        </p>
      )}

      {data && (
        <div className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.steps.map((step, idx) => {
              const barWidth = Math.round((step.count / maxCount) * 100);
              return (
                <div
                  key={step.eventType}
                  className="flex flex-col gap-2 rounded-xl border border-border/[var(--border-alpha,0.5)] bg-card/60 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Step {idx + 1}
                      </p>
                      <p className="mt-0.5 font-semibold">
                        {EVENT_LABELS[step.eventType] ?? step.eventType}
                      </p>
                    </div>
                    <span className="text-2xl font-bold tabular-nums">
                      {step.count.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-border/40">
                    <div
                      className="h-full rounded-full bg-primary/60 transition-all duration-500"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  {step.conversionRate !== null && (
                    <p className="text-xs text-muted-foreground">
                      {step.conversionRate}% from previous step
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Table view */}
          <div className="mt-2 overflow-x-auto rounded-2xl border border-border/[var(--border-alpha,0.5)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/[var(--border-alpha,0.5)] bg-card/40">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Event</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">Count</th>
                  <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                    Conversion from prev
                  </th>
                </tr>
              </thead>
              <tbody>
                {data.steps.map((step) => (
                  <tr
                    key={step.eventType}
                    className="border-b border-border/[var(--border-alpha,0.5)] last:border-0 hover:bg-card/30"
                  >
                    <td className="px-4 py-3 font-medium">
                      {EVENT_LABELS[step.eventType] ?? step.eventType}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {step.count.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {step.conversionRate !== null ? (
                        <span
                          className={
                            step.conversionRate >= 50 ? 'text-emerald-400' : 'text-amber-400'
                          }
                        >
                          {step.conversionRate}%
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
