import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { fetchJson, getApiUrl } from '@/lib/utils';

interface BarSettingsResponse {
  name: string;
  slug: string;
  location?: string | null;
  introText?: string | null;
  outroText?: string | null;
  theme: Record<string, string>;
}

interface BarPageProps {
  params: { barSlug: string };
}

async function loadBar(barSlug: string): Promise<BarSettingsResponse> {
  const url = `${getApiUrl()}/bars/${barSlug}/settings`;

  try {
    return await fetchJson<BarSettingsResponse>(url, { cache: 'no-store' });
  } catch (error) {
    notFound();
    throw error instanceof Error ? error : new Error('Bar not found');
  }
}

export default async function BarLandingPage({ params }: BarPageProps) {
  const bar = await loadBar(params.barSlug);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-16 px-6 py-20">
      <header className="space-y-3 text-center">
        <span className="text-xs uppercase tracking-[0.45em] text-muted-foreground">
          {bar.location ?? 'Your favourite bar'}
        </span>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          {bar.name}
        </h1>
        {bar.introText ? (
          <p className="mx-auto max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            {bar.introText}
          </p>
        ) : null}
      </header>

      <section className="grid gap-8 rounded-3xl border border-border/50 bg-card/70 p-10 shadow-xl shadow-primary/10 backdrop-blur">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Discover your cocktail personality</h2>
          <p className="text-balance text-sm text-muted-foreground sm:text-base">
            Step through nine quick questions inspired by our mixologists. We&apos;ll analyse your answers, mix in the
            bar&apos;s signature ingredients and reveal a cocktail that&apos;s crafted just for you.
          </p>
        </div>
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Time</dt>
            <dd className="mt-1 text-lg font-semibold">3 minutes</dd>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Questions</dt>
            <dd className="mt-1 text-lg font-semibold">9 tailored prompts</dd>
          </div>
          <div className="rounded-2xl border border-border/60 bg-background/60 p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Result</dt>
            <dd className="mt-1 text-lg font-semibold">Bespoke recipe</dd>
          </div>
        </dl>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            You&apos;ll preview the recipe immediately after checkout, with the full method ready for the bar team.
          </p>
          <Button asChild size="lg" className="sm:w-auto">
            <Link href={`/b/${bar.slug}/quiz`}>Begin the experience</Link>
          </Button>
        </div>
      </section>

      {bar.outroText ? (
        <footer className="text-center text-sm text-muted-foreground">{bar.outroText}</footer>
      ) : null}
    </div>
  );
}
