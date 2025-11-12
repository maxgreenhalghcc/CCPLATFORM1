'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { cn, fetchJson, getApiUrl } from '@/lib/utils';

interface BarListItem {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  active: boolean;
  pricingPounds: number | null;
  theme: Record<string, string> | null;
}

interface BarsResponse {
  items: BarListItem[];
  meta?: {
    total: number;
    page: number;
    pageSize: number;
    pageCount: number;
  };
}

type ActiveFilter = 'all' | 'active' | 'inactive';

const PAGE_SIZE = 10;

function formatPrice(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return '—';
  }
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(value);
}

export default function BarsClient() {
  const { data: session, status } = useSession();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<ActiveFilter>('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<BarsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filter]);

  const meta = data?.meta;
  const canGoPrev = (meta?.page ?? 1) > 1;
  const canGoNext = meta ? meta.page < meta.pageCount : false;

  useEffect(() => {
    const token = session?.apiToken;
    if (!token || status !== 'authenticated') {
      return;
    }

    let isCancelled = false;
    const controller = new AbortController();

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const api = getApiUrl();
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(PAGE_SIZE)
        });
        if (debouncedSearch) {
          params.set('search', debouncedSearch);
        }
        if (filter !== 'all') {
          params.set('active', filter === 'active' ? 'true' : 'false');
        }
        const url = `${api}/bars?${params.toString()}`;
        const response = await fetchJson<BarsResponse>(url, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal
        });
        if (!isCancelled) {
          setData(response);
        }
      } catch (err) {
        if (!isCancelled) {
          if ((err as Error)?.name === 'AbortError') {
            return;
          }
          setError(err instanceof Error ? err.message : 'Failed to load bars');
          setData(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [session?.apiToken, status, debouncedSearch, filter, page, reloadKey]);

  const items = useMemo(() => data?.items ?? [], [data]);

  return (
    <div className="space-y-8 px-6 py-16">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Bars</h1>
            <p className="text-sm text-muted-foreground">
              Manage bar tenants, configure branding, and assign pricing.
            </p>
          </div>
          <Button asChild>
            <Link href="/admin/bars/new">Add bar</Link>
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="search"
            placeholder="Search by name, slug, or location"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-10 w-full max-w-md rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            aria-label="Search bars"
          />
          <div className="flex items-center gap-2">
            {(['all', 'active', 'inactive'] as ActiveFilter[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                className={cn(
                  'rounded-md px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  filter === option
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border bg-background text-muted-foreground hover:bg-muted'
                )}
              >
                {option === 'all' ? 'All' : option === 'active' ? 'Active' : 'Inactive'}
              </button>
            ))}
          </div>
        </div>
      </header>

      {status === 'loading' || isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-lg bg-muted/40" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-6 text-destructive">
          <p className="font-medium">Unable to load bars.</p>
          <p className="mt-1 text-sm opacity-80">{error}</p>
          <Button
            onClick={() => setReloadKey((current) => current + 1)}
            className="mt-3"
            variant="outline"
          >
            Retry
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
          <p>No bars match the current filters.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead>
                <tr className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Bar</th>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Theme</th>
                  <th className="px-4 py-3 font-medium" aria-hidden />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((bar) => (
                  <tr key={bar.id} className="hover:bg-muted/30">
                    <td className="px-4 py-4">
                      <div className="font-medium text-foreground">{bar.name}</div>
                      <div className="text-xs text-muted-foreground">ID: {bar.id}</div>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{bar.slug}</td>
                    <td className="px-4 py-4 text-muted-foreground">{bar.location ?? '—'}</td>
                    <td className="px-4 py-4">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-1 text-xs font-medium',
                          bar.active
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {bar.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">{formatPrice(bar.pricingPounds)}</td>
                    <td className="px-4 py-4">
                      {bar.theme ? (
                        <div
                          className="flex h-10 w-28 overflow-hidden rounded-md border"
                          aria-label="Theme preview"
                        >
                          <div
                            className="h-full w-1/2"
                            style={{ backgroundColor: bar.theme.background ?? '#0b0b12' }}
                          />
                          <div
                            className="h-full w-1/2"
                            style={{ backgroundColor: bar.theme.primary ?? '#7c3aed' }}
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">Not configured</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/admin/bars/${bar.id}`}>Manage</Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Showing page {meta?.page ?? 1} of {meta?.pageCount ?? 1}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!canGoPrev}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!canGoNext}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
