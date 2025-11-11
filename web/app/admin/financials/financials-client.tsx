'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { cn, fetchJson, getApiUrl } from '@/lib/utils';
import * as Sentry from '@sentry/nextjs';

interface RevenueSeriesPoint {
  date: string;
  value: number;
}

interface RevenueResponse {
  currency: string;
  total: number;
  series: RevenueSeriesPoint[];
}

interface OrdersSeriesPoint {
  date: string;
  count: number;
}

interface OrdersResponse {
  total: number;
  series: OrdersSeriesPoint[];
}

type RangeOption = '7d' | '30d' | '90d';

const RANGE_OPTIONS: RangeOption[] = ['7d', '30d', '90d'];

/**
 * Format a numeric value as a localized currency string using the en-GB locale and an uppercased currency code.
 *
 * @param amount - The numeric amount to format
 * @param currency - The ISO currency code (e.g., "gbp", "usd"); the code will be uppercased
 * @returns The formatted currency string (for example, "£1,234.56")
 */
function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount);
}

/**
 * Converts an ISO or parseable date string into a short month/day label or returns the original value if the string is not a valid date.
 *
 * @param value - A date string parsable by Date
 * @returns The formatted date label like `Jan 5` for valid dates, or the original `value` when the input is invalid
 */
function formatDateLabel(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    day: 'numeric'
  }).format(date);
}

interface LineChartProps<T> {
  data: T[];
  getValue: (point: T) => number;
  className?: string;
}

/**
 * Renders a simple inline line chart for a series of data points.
 *
 * @param data - Array of data points to plot.
 * @param getValue - Function that extracts the numeric value from a data point.
 * @param className - Optional additional className applied to the root element.
 * @returns A responsive SVG line chart with small point markers, or a centered placeholder when `data` is empty.
 */
function SimpleLineChart<T>({ data, getValue, className }: LineChartProps<T>) {
  if (!data.length) {
    return (
      <div className={cn('flex h-36 w-full items-center justify-center rounded-lg bg-muted/20', className)}>
        <p className="text-sm text-muted-foreground">No data for selected range.</p>
      </div>
    );
  }

  const values = data.map((point) => getValue(point));
  const maxValue = Math.max(...values, 0);
  const minValue = Math.min(...values, 0);
  const range = Math.max(maxValue - minValue, 1);
  const height = 60;
  const width = 100;
  const paddingX = 6;
  const paddingY = 8;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const points = data
    .map((point, index) => {
      const relativeX = data.length === 1 ? 0.5 : index / (data.length - 1);
      const value = getValue(point);
      const normalizedY = (value - minValue) / range;
      const x = paddingX + relativeX * chartWidth;
      const y = paddingY + (1 - normalizedY) * chartHeight;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={cn('h-36 w-full text-primary', className)}
      role="presentation"
      aria-hidden
    >
      <polyline fill="none" stroke="currentColor" strokeWidth={2} points={points} />
      {data.map((point, index) => {
        const relativeX = data.length === 1 ? 0.5 : index / (data.length - 1);
        const value = getValue(point);
        const normalizedY = (value - minValue) / range;
        const cx = paddingX + relativeX * chartWidth;
        const cy = paddingY + (1 - normalizedY) * chartHeight;
        return <circle key={`${index}-${cx}`} cx={cx} cy={cy} r={1.6} fill="currentColor" />;
      })}
    </svg>
  );
}

/**
 * Renders the admin financials dashboard UI with range selection, optional bar filtering, metric cards, and charts.
 *
 * The component reads the current session token to fetch revenue and orders metrics for the selected range and optional bar ID,
 * handles loading, retry, and abort on unmount, and displays totals, average order value, and daily series charts.
 *
 * @returns The rendered admin financials dashboard component.
 */
export default function AdminFinancialsClient() {
  const { data: session, status } = useSession();
  const [range, setRange] = useState<RangeOption>('30d');
  const [barInput, setBarInput] = useState('');
  const [barFilter, setBarFilter] = useState<string | undefined>();
  const [revenue, setRevenue] = useState<RevenueResponse | null>(null);
  const [orders, setOrders] = useState<OrdersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    const abortController = new AbortController();

    async function loadMetrics() {
      if (status === 'loading') {
        return;
      }

      const token = session?.apiToken;
      if (!token) {
        setRevenue(null);
        setOrders(null);
        setError('Authentication required to view financial metrics.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const apiBase = getApiUrl();
        const params = new URLSearchParams({ range });
        if (barFilter && barFilter.length > 0) {
          params.set('barId', barFilter);
        }
        const headers: HeadersInit = { Authorization: `Bearer ${token}` };
        const requestInit: RequestInit = {
          cache: 'no-store',
          headers,
          signal: abortController.signal
        };
        const [revenueResponse, ordersResponse] = await Sentry.startSpan(
          { name: 'admin.metrics.fetch', op: 'ui.action' },
          () =>
            Promise.all([
              fetchJson<RevenueResponse>(`${apiBase}/admin/metrics/revenue?${params.toString()}`, requestInit),
              fetchJson<OrdersResponse>(`${apiBase}/admin/metrics/orders?${params.toString()}`, requestInit)
            ])
        );
        if (!isCancelled) {
          setRevenue(revenueResponse);
          setOrders(ordersResponse);
        }
      } catch (err) {
        Sentry.captureException(err);
        if (isCancelled || (err instanceof DOMException && err.name === 'AbortError')) {
          return;
        }
        const message = err instanceof Error ? err.message : 'Failed to load financial metrics.';
        setError(message);
        setRevenue(null);
        setOrders(null);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadMetrics();

    return () => {
      isCancelled = true;
      abortController.abort();
    };
  }, [range, barFilter, refreshKey, session?.apiToken, status]);

  const handleApplyBarFilter = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = barInput.trim();
      setBarFilter(trimmed.length > 0 ? trimmed : undefined);
    },
    [barInput]
  );

  const handleClearBarFilter = useCallback(() => {
    setBarInput('');
    setBarFilter(undefined);
  }, []);

  const handleRetry = useCallback(() => {
    setRefreshKey((value) => value + 1);
  }, []);

  const currencyCode = revenue?.currency ?? 'GBP';
  const totalRevenue = revenue?.total ?? 0;
  const orderCount = orders?.total ?? 0;
  const averageOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

  const revenueSeries = useMemo(() => revenue?.series ?? [], [revenue]);
  const ordersSeries = useMemo(() => orders?.series ?? [], [orders]);

  const showInitialSkeleton = isLoading && !revenue && !orders && !error;

  return (
    <div className="space-y-10 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Financial dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Track revenue, order volumes, and payment health across all bar tenants.
        </p>
      </header>

      <section className="flex flex-col gap-4 rounded-xl border bg-card p-4 shadow-sm md:flex-row md:items-end md:justify-between">
        <div className="flex items-center gap-2">
          {RANGE_OPTIONS.map((option) => (
            <Button
              key={option}
              size="sm"
              variant={range === option ? 'default' : 'outline'}
              onClick={() => setRange(option)}
              disabled={isLoading && range === option}
            >
              Last {option}
            </Button>
          ))}
        </div>
        <form className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center" onSubmit={handleApplyBarFilter}>
          <label className="flex-1 text-sm">
            <span className="sr-only">Bar filter</span>
            <input
              className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Filter by bar slug or ID"
              value={barInput}
              onChange={(event) => setBarInput(event.target.value)}
            />
          </label>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isLoading}>
              Apply
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={handleClearBarFilter}
              disabled={isLoading || (!barFilter && barInput.trim().length === 0)}
            >
              Clear
            </Button>
          </div>
        </form>
      </section>

      {error ? (
        <section className="rounded-xl border border-destructive/40 bg-destructive/10 p-6">
          <h2 className="text-lg font-semibold text-destructive">Unable to load metrics</h2>
          <p className="mt-2 text-sm text-destructive">{error}</p>
          <Button className="mt-4" variant="outline" onClick={handleRetry}>
            Retry
          </Button>
        </section>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            {[
              {
                label: `Total revenue (last ${range})`,
                content: showInitialSkeleton ? null : formatCurrency(totalRevenue, currencyCode)
              },
              {
                label: `Orders processed (last ${range})`,
                content: showInitialSkeleton ? null : orderCount.toLocaleString()
              },
              {
                label: 'Average order value',
                content: showInitialSkeleton ? null : formatCurrency(averageOrderValue, currencyCode)
              }
            ].map((card, index) => (
              <article key={index} className="rounded-xl border bg-card p-6 shadow-sm">
                <p className="text-sm text-muted-foreground">{card.label}</p>
                {showInitialSkeleton ? (
                  <div className="mt-4 h-8 w-2/3 animate-pulse rounded bg-muted" />
                ) : (
                  <p className="mt-2 text-3xl font-semibold">{card.content}</p>
                )}
              </article>
            ))}
          </section>

          <section className="grid gap-8 md:grid-cols-2">
            <div className="rounded-xl border bg-card p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Daily revenue</h2>
                {isLoading && !showInitialSkeleton && <span className="text-xs text-muted-foreground">Refreshing…</span>}
              </div>
              <div className="mt-4">
                {showInitialSkeleton ? (
                  <div className="h-36 w-full animate-pulse rounded-lg bg-muted" />
                ) : (
                  <SimpleLineChart data={revenueSeries} getValue={(point) => point.value} />
                )}
              </div>
              {revenueSeries.length > 0 && (
                <dl className="mt-4 space-y-2 text-sm">
                  {revenueSeries.map((point) => (
                    <div className="flex items-center justify-between" key={point.date}>
                      <dt className="text-muted-foreground">{formatDateLabel(point.date)}</dt>
                      <dd>{formatCurrency(point.value, currencyCode)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>

            <div className="rounded-xl border bg-card p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Daily order volume</h2>
                {isLoading && !showInitialSkeleton && <span className="text-xs text-muted-foreground">Refreshing…</span>}
              </div>
              <div className="mt-4">
                {showInitialSkeleton ? (
                  <div className="h-36 w-full animate-pulse rounded-lg bg-muted" />
                ) : (
                  <SimpleLineChart data={ordersSeries} getValue={(point) => point.count} />
                )}
              </div>
              {ordersSeries.length > 0 && (
                <dl className="mt-4 space-y-2 text-sm">
                  {ordersSeries.map((point) => (
                    <div className="flex items-center justify-between" key={point.date}>
                      <dt className="text-muted-foreground">{formatDateLabel(point.date)}</dt>
                      <dd>{point.count.toLocaleString()}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}