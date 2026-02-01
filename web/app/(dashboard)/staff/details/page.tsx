import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { apiFetch, getApiBaseUrl } from '@/app/lib/api';

interface BarSettingsResponse {
  id: string;
  name: string;
  slug: string;
  introText: string | null;
  outroText: string | null;
  pricingPounds: number;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: Record<string, string> | null;
  openingHours: Record<string, string> | null;
  stock: string[];
  stockListUrl: string | null;
  bankDetails: Record<string, string> | null;
  stripeConnectId: string | null;
  stripeConnectLink: string | null;
  brandPalette: Record<string, string> | null;
  logoUrl: string | null;
}

async function fetchBarSettings(barIdentifier: string, token?: string): Promise<BarSettingsResponse> {
  const baseUrl = getApiBaseUrl();
  const res = await apiFetch(`${baseUrl}/v1/bars/${barIdentifier}/settings`, {
    cache: 'no-store',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined
  });

  if (!res.ok) {
    throw new Error('Unable to load bar settings');
  }

  return (await res.json()) as BarSettingsResponse;
}

function listFromRecord(record: Record<string, string> | null | undefined): Array<{ label: string; value: string }> {
  if (!record) {
    return [];
  }

  return Object.entries(record)
    .filter(([, value]) => typeof value === 'string' && value.trim().length > 0)
    .map(([label, value]) => ({ label, value: value.trim() }));
}

function paletteSwatches(palette: Record<string, string> | null | undefined) {
  if (!palette) {
    return [
      { label: 'Dominant', value: '#050315' },
      { label: 'Secondary', value: '#2f27ce' },
      { label: 'Accent', value: '#dedcff' }
    ];
  }

  return [
    { label: 'Dominant', value: palette.dominant ?? '#050315' },
    { label: 'Secondary', value: palette.secondary ?? '#2f27ce' },
    { label: 'Accent', value: palette.accent ?? '#dedcff' }
  ];
}

export default async function StaffDetailsPage() {
  const session = await auth();

  if (!session || session.user.role !== 'staff') {
    redirect(`/login?callbackUrl=${encodeURIComponent('/staff/details')}`);
  }

  const barIdentifier = session.user.barId ?? 'demo-bar';

  let settings: BarSettingsResponse;
  try {
    settings = await fetchBarSettings(barIdentifier, session.apiToken);
  } catch (error) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-6 py-16">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">Venue details</h1>
          <p className="text-muted-foreground">Unable to load the bar configuration for this account.</p>
          <nav className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
            <Link className="rounded-full border border-border px-3 py-1 transition hover:border-primary/60 hover:text-foreground" href="/staff">
              Orders
            </Link>
            <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">Venue details</span>
          </nav>
        </header>
        <p className="text-sm text-destructive">{error instanceof Error ? error.message : 'Unknown error'}.</p>
      </div>
    );
  }

  const contactItems = [
    { label: 'Owner', value: settings.contactName ?? '—' },
    { label: 'Email', value: settings.contactEmail ?? '—' },
    { label: 'Phone', value: settings.contactPhone ?? '—' }
  ];

  const addressItems = listFromRecord(settings.address);
  const openingHours = listFromRecord(settings.openingHours);
  const stockItems = settings.stock?.filter((item) => item.trim().length > 0) ?? [];
  const bankItems = listFromRecord(settings.bankDetails);
  const swatches = paletteSwatches(settings.brandPalette);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">Venue details</h1>
        <p className="text-muted-foreground">
          Reference contact, stock, and payout details for <span className="font-medium text-foreground">{settings.name}</span>.
        </p>
        <nav className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
          <Link className="rounded-full border border-border px-3 py-1 transition hover:border-primary/60 hover:text-foreground" href="/staff">
            Orders
          </Link>
          <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">Venue details</span>
        </nav>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <article className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Contact</h2>
          <dl className="mt-4 space-y-2 text-sm">
            {contactItems.map((item) => (
              <div className="flex justify-between gap-4" key={item.label}>
                <dt className="text-muted-foreground">{item.label}</dt>
                <dd className="text-right text-foreground">{item.value}</dd>
              </div>
            ))}
          </dl>
        </article>

        <article className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Stock</h2>
          {stockItems.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">No stock list has been captured yet.</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm">
              {stockItems.map((item) => (
                <li className="flex items-center justify-between" key={item}>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          )}
          {settings.stockListUrl ? (
            <a
              className="mt-4 inline-flex items-center text-sm font-medium text-primary hover:text-primary/80"
              href={settings.stockListUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              Download stock list
            </a>
          ) : null}
        </article>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <article className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Address</h2>
          {addressItems.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Address not configured.</p>
          ) : (
            <address className="mt-4 space-y-1 text-sm not-italic text-foreground">
              {addressItems.map((item) => (
                <div key={item.label}>{item.value}</div>
              ))}
            </address>
          )}
        </article>

        <article className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Opening hours</h2>
          {openingHours.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Hours not configured.</p>
          ) : (
            <ul className="mt-4 space-y-2 text-sm text-foreground">
              {openingHours.map((item) => (
                <li className="flex items-center justify-between" key={item.label}>
                  <span className="text-muted-foreground">{item.label}</span>
                  <span>{item.value}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <article className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Payouts</h2>
          {bankItems.length === 0 && !settings.stripeConnectId ? (
            <p className="mt-4 text-sm text-muted-foreground">Bank details not yet provided.</p>
          ) : (
            <dl className="mt-4 space-y-2 text-sm">
              {bankItems.map((item) => (
                <div className="flex justify-between gap-4" key={item.label}>
                  <dt className="text-muted-foreground">{item.label}</dt>
                  <dd className="text-right text-foreground">{item.value}</dd>
                </div>
              ))}
              {settings.stripeConnectId ? (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Stripe account</dt>
                  <dd className="text-right text-foreground">{settings.stripeConnectId}</dd>
                </div>
              ) : null}
            </dl>
          )}
          {settings.stripeConnectLink ? (
            <a
              className="mt-4 inline-flex items-center text-sm font-medium text-primary hover:text-primary/80"
              href={settings.stripeConnectLink}
              rel="noopener noreferrer"
              target="_blank"
            >
              Open Stripe Connect
            </a>
          ) : null}
        </article>

        <article className="rounded-2xl border border-border/70 bg-card/80 p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Brand palette</h2>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {swatches.map((swatch) => (
              <div key={swatch.label} className="rounded-xl border border-border/60 p-3 text-center text-xs">
                <div
                  className="mx-auto mb-2 h-12 w-12 rounded-full border border-border"
                  style={{ backgroundColor: swatch.value }}
                />
                <p className="font-medium text-foreground">{swatch.label}</p>
                <p className="font-mono text-[10px] text-muted-foreground">{swatch.value}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
