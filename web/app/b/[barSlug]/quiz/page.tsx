import { notFound } from 'next/navigation';
import { fetchJson, getApiUrl } from '@/lib/utils';
import QuizFlow from './QuizFlowClient';

interface QuizPageProps {
  params: { barSlug: string };
}

interface BarSettingsResponse {
  name: string;
  slug: string;
  introText?: string | null;
  outroText?: string | null;
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

export default async function QuizPage({ params }: QuizPageProps) {
  const bar = await loadBar(params.barSlug);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-14">
      <header className="space-y-2 text-center">
        <p className="text-xs uppercase tracking-[0.45em] text-muted-foreground">Mixology quiz</p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">{bar.name}</h1>
        {bar.introText ? (
          <p className="mx-auto max-w-2xl text-pretty text-sm text-muted-foreground sm:text-base">
            {bar.introText}
          </p>
        ) : null}
      </header>
      <QuizFlow barSlug={bar.slug} outroText={bar.outroText ?? undefined} />
    </div>
  );
}
