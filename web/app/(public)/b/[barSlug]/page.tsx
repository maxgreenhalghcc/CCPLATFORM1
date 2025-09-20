import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { fetchJson, themeToCssVars } from '@/lib/utils';

interface BarSettingsResponse {
  name: string;
  slug: string;
  location?: string;
  theme: Record<string, string>;
  introText: string;
  outroText: string;
}

async function getBar(barSlug: string): Promise<BarSettingsResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';
  const url = `${baseUrl}/v1/bars/${barSlug}/settings`;

  try {
    const data = await fetchJson<BarSettingsResponse>(url, {
      cache: 'no-store'
    });
    return data;
  } catch (error) {
    console.error('Failed to fetch bar settings', error);
    notFound();
    throw new Error('Bar not found');
  }
}

interface BarPageProps {
  params: { barSlug: string };
}

export default async function BarLandingPage({ params }: BarPageProps) {
  const { barSlug } = params;
  const bar = await getBar(barSlug);
  const cssVars = themeToCssVars(bar.theme);

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-background via-background to-background/80"
      style={cssVars}
    >
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-16">
        <div className="space-y-4 text-center">
          <span className="text-sm uppercase tracking-[0.35em] text-muted-foreground">{bar.location ?? 'Your City'}</span>
          <h1 className="text-balance text-4xl font-semibold sm:text-5xl">{bar.name}</h1>
          <p className="text-lg text-muted-foreground">{bar.introText}</p>
        </div>
        <div className="grid gap-6 rounded-2xl border bg-card/60 p-8 backdrop-blur">
          <div className="space-y-2 text-left">
            <h2 className="text-2xl font-semibold">Custom Cocktail Quiz</h2>
            <p className="text-muted-foreground">
              Answer nine quick questions and we&apos;ll craft a bespoke cocktail recipe for you. Once payment is confirmed, our
              bartenders get the order instantly.
            </p>
          </div>
          <Button asChild size="lg">
            <Link href={`/b/${bar.slug}/quiz`}>Start the quiz</Link>
          </Button>
        </div>
        <p className="text-center text-sm text-muted-foreground">{bar.outroText}</p>
      </div>
    </div>
  );
}
