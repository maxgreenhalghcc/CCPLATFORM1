import { buildGuardHeaders, getApiBaseUrl } from '@/app/lib/api';

interface RevenueSeriesPoint {
  date: string;
  value: number;
}

interface RevenueResponse {
  barId: string | null;
  range: string;
  currency: string;
  total: number;
  series: RevenueSeriesPoint[];
}

interface OrdersSeriesPoint {
  date: string;
  count: number;
}

interface OrdersResponse {
  barId: string | null;
  range: string;
  total: number;
  series: OrdersSeriesPoint[];
}

async function fetchRevenue(): Promise<RevenueResponse> {
  const baseUrl = getApiBaseUrl();
  const headers = buildGuardHeaders();
  const res = await fetch(`${baseUrl}/v1/admin/metrics/revenue`, {
    cache: 'no-store',
    headers
  });
  if (!res.ok) {
    return { barId: null, range: '30d', currency: 'GBP', total: 0, series: [] };
  }
  return (await res.json()) as RevenueResponse;
}

async function fetchOrderMetrics(): Promise<OrdersResponse> {
  const baseUrl = getApiBaseUrl();
  const headers = buildGuardHeaders();
  const res = await fetch(`${baseUrl}/v1/admin/metrics/orders`, {
    cache: 'no-store',
    headers
  });
  if (!res.ok) {
    return { barId: null, range: '30d', total: 0, series: [] };
  }
  return (await res.json()) as OrdersResponse;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount);
}

function formatDateLabel(value: string) {
  const date = new Date(value);
  return new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    day: 'numeric'
  }).format(date);
}

export default async function AdminFinancialsPage() {
  const [revenue, orders] = await Promise.all([fetchRevenue(), fetchOrderMetrics()]);

  return (
    <div className="space-y-10 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Financial dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Track revenue, order volumes, and payment health across all bar tenants.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="rounded-xl border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Total revenue ({revenue.range})</p>
          <p className="mt-2 text-3xl font-semibold">
            {formatCurrency(revenue.total, revenue.currency || 'GBP')}
          </p>
        </article>
        <article className="rounded-xl border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Orders processed ({orders.range})</p>
          <p className="mt-2 text-3xl font-semibold">{orders.total}</p>
        </article>
        <article className="rounded-xl border bg-card p-6 shadow-sm">
          <p className="text-sm text-muted-foreground">Average order value</p>
          <p className="mt-2 text-3xl font-semibold">
            {orders.total > 0
              ? formatCurrency(revenue.total / orders.total, revenue.currency || 'GBP')
              : formatCurrency(0, revenue.currency || 'GBP')}
          </p>
        </article>
      </section>

      <section className="grid gap-8 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold">Daily revenue</h2>
          {revenue.series.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Revenue data will appear here once paid orders are recorded.
            </p>
          ) : (
            <dl className="mt-4 space-y-2 text-sm">
              {revenue.series.map((point) => (
                <div className="flex items-center justify-between" key={point.date}>
                  <dt className="text-muted-foreground">{formatDateLabel(point.date)}</dt>
                  <dd>{formatCurrency(point.value, revenue.currency || 'GBP')}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-semibold">Daily order volume</h2>
          {orders.series.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Orders will surface here once quiz submissions complete checkout.
            </p>
          ) : (
            <dl className="mt-4 space-y-2 text-sm">
              {orders.series.map((point) => (
                <div className="flex items-center justify-between" key={point.date}>
                  <dt className="text-muted-foreground">{formatDateLabel(point.date)}</dt>
                  <dd>{point.count}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>
    </div>
  );
}
