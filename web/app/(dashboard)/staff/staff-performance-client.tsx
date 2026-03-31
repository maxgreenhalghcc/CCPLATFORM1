'use client';

import { useEffect, useState } from 'react';
import { getApiBaseUrl } from '@/app/lib/api';

interface Tier {
  id: string;
  name: string;
  threshold: number;
  payoutAmount: number;
  sortOrder: number;
}

interface CurrentPerformance {
  barId: string;
  weekStart: string;
  fulfilledCount: number;
  baseline: number;
  percentageChange: number;
  currentTier: { id: string; name: string; payoutAmount: number } | null;
  nextTier: {
    id: string;
    name: string;
    threshold: number;
    payoutAmount: number;
    remaining: number;
  } | null;
  tiers: Tier[];
  projectedPayout: number;
}

interface HistoryRecord {
  id: string;
  weekStart: string;
  fulfilledCount: number;
  tierName: string | null;
  payoutAmount: number;
  payoutStatus: 'PENDING' | 'PAID';
  paidAt: string | null;
}

interface LeaderboardEntry {
  rank: number;
  barId: string;
  displayName: string;
  fulfilledCount: number;
  percentageChange: number;
  tierName: string | null;
}

interface Props {
  barId: string;
  token: string;
}

export default function StaffPerformanceClient({ barId, token }: Props) {
  const [perf, setPerf] = useState<CurrentPerformance | null>(null);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const base = getApiBaseUrl();
    const headers = { Authorization: `Bearer ${token}` };

    async function load() {
      try {
        const [perfRes, histRes, lbRes] = await Promise.all([
          fetch(`${base}/v1/bars/${barId}/performance/current`, { headers, cache: 'no-store' }),
          fetch(`${base}/v1/bars/${barId}/performance/history?weeks=4`, { headers, cache: 'no-store' }),
          fetch(`${base}/v1/performance/leaderboard`, { headers, cache: 'no-store' }),
        ]);

        if (perfRes.ok) setPerf(await perfRes.json());
        if (histRes.ok) setHistory(await histRes.json());
        if (lbRes.ok) setLeaderboard(await lbRes.json());
      } catch {
        // silently degrade — widget is non-critical
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [barId, token]);

  if (loading) {
    return (
      <div className="h-48 animate-pulse rounded-2xl border border-border/[var(--border-alpha,0.5)] bg-card/60" />
    );
  }

  // No tiers configured yet — don't show the widget
  if (!perf || perf.tiers.length === 0) return null;

  const { fulfilledCount, currentTier, nextTier, projectedPayout, tiers, weekStart } = perf;

  // Progress toward next tier
  const progressTier = nextTier ?? (tiers.length > 0 ? tiers[tiers.length - 1] : null);
  const progressMax = progressTier?.threshold ?? 1;
  const progressPct = Math.min(100, Math.round((fulfilledCount / progressMax) * 100));

  const weekLabel = formatWeek(weekStart);
  const myRank = leaderboard.find((e) => e.barId === barId);

  return (
    <div className="flex flex-col gap-4">
      {/* Weekly progress card */}
      <div className="rounded-2xl border border-border/[var(--border-alpha,0.5)] bg-card/80 p-6 shadow-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Left: count + tier */}
          <div className="flex flex-col gap-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {weekLabel}
            </p>
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold tabular-nums leading-none">{fulfilledCount}</span>
              <span className="mb-1 text-lg text-muted-foreground">cocktails served</span>
            </div>
            {currentTier ? (
              <div className="mt-1 flex items-center gap-2">
                <TierBadge name={currentTier.name} />
                <span className="text-sm font-medium text-emerald-400">
                  £{currentTier.payoutAmount.toFixed(2)} earned
                </span>
              </div>
            ) : (
              <p className="mt-1 text-sm text-muted-foreground">No tier reached yet</p>
            )}
          </div>

          {/* Right: projected payout */}
          {projectedPayout > 0 && (
            <div className="rounded-xl bg-emerald-500/10 px-4 py-3 text-center ring-1 ring-emerald-500/20">
              <p className="text-xs text-emerald-400/80">This week</p>
              <p className="text-2xl font-bold text-emerald-400">£{projectedPayout.toFixed(2)}</p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        {progressTier && (
          <div className="mt-4 flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {nextTier
                  ? `${nextTier.remaining} more for ${nextTier.name} (£${nextTier.payoutAmount.toFixed(2)})`
                  : `${currentTier?.name} achieved!`}
              </span>
              <span>{progressPct}%</span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-border/40">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0</span>
              {tiers.map((t) => (
                <span key={t.id} className="flex flex-col items-center">
                  <span>{t.threshold}</span>
                  <span className="text-[10px]">{t.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="rounded-2xl border border-border/[var(--border-alpha,0.5)] bg-card/80 p-5 shadow-card">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              This week&apos;s leaderboard
            </h3>
            <ol className="flex flex-col gap-1.5">
              {leaderboard.slice(0, 8).map((entry) => {
                const isYou = entry.barId === barId;
                return (
                  <li
                    key={entry.barId}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                      isYou
                        ? 'bg-primary/10 font-semibold ring-1 ring-primary/30'
                        : 'hover:bg-card'
                    }`}
                  >
                    <span className="w-5 text-center text-xs tabular-nums text-muted-foreground">
                      {entry.rank}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {entry.displayName}
                      {isYou && (
                        <span className="ml-1.5 rounded bg-primary/20 px-1 py-0.5 text-[10px] text-primary">
                          you
                        </span>
                      )}
                    </span>
                    {entry.tierName && <TierBadge name={entry.tierName} small />}
                    <span
                      className={`tabular-nums text-xs ${
                        entry.percentageChange >= 0 ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {entry.percentageChange >= 0 ? '+' : ''}
                      {entry.percentageChange}%
                    </span>
                  </li>
                );
              })}
            </ol>
            {myRank && myRank.rank > 8 && (
              <div className="mt-2 flex items-center gap-3 rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold ring-1 ring-primary/30">
                <span className="w-5 text-center text-xs tabular-nums text-muted-foreground">
                  {myRank.rank}
                </span>
                <span className="flex-1 truncate">
                  {myRank.displayName}
                  <span className="ml-1.5 rounded bg-primary/20 px-1 py-0.5 text-[10px] text-primary">
                    you
                  </span>
                </span>
                {myRank.tierName && <TierBadge name={myRank.tierName} small />}
                <span
                  className={`tabular-nums text-xs ${
                    myRank.percentageChange >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {myRank.percentageChange >= 0 ? '+' : ''}
                  {myRank.percentageChange}%
                </span>
              </div>
            )}
          </div>
        )}

        {/* Earnings summary */}
        {history.length > 0 && (
          <div className="rounded-2xl border border-border/[var(--border-alpha,0.5)] bg-card/80 p-5 shadow-card">
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Recent earnings
            </h3>
            <ul className="flex flex-col gap-1.5">
              {history.slice(0, 4).map((record) => (
                <li
                  key={record.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm hover:bg-card"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{formatWeek(record.weekStart)}</span>
                    <span className="text-xs text-muted-foreground">
                      {record.fulfilledCount} cocktails
                      {record.tierName && ` · ${record.tierName}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">£{record.payoutAmount.toFixed(2)}</span>
                    <StatusPill status={record.payoutStatus} />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function TierBadge({ name, small }: { name: string; small?: boolean }) {
  const colours: Record<string, string> = {
    Bronze: 'bg-amber-800/30 text-amber-400 ring-amber-700/30',
    Silver: 'bg-slate-500/20 text-slate-300 ring-slate-500/30',
    Gold: 'bg-yellow-500/20 text-yellow-300 ring-yellow-500/30',
  };
  const cls =
    colours[name] ?? 'bg-primary/20 text-primary ring-primary/30';
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2 py-0.5 font-semibold ring-1 ${cls} ${
        small ? 'text-[10px]' : 'text-xs'
      }`}
    >
      {name}
    </span>
  );
}

function StatusPill({ status }: { status: 'PENDING' | 'PAID' }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ${
        status === 'PAID'
          ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
          : 'bg-amber-500/10 text-amber-400 ring-amber-500/20'
      }`}
    >
      {status === 'PAID' ? 'Paid' : 'Pending'}
    </span>
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
