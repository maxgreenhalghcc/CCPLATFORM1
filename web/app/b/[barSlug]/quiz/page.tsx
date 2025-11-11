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

/**
 * Load the settings for a bar identified by its slug.
 *
 * @param barSlug - The bar's slug used to construct the API endpoint.
 * @returns The bar settings object with `name`, `slug`, and optional `introText` and `outroText`.
 * @throws Error when the settings cannot be retrieved; calls `notFound()` before throwing.
 */
async function loadBar(barSlug: string): Promise<BarSettingsResponse> {
  const url = `${getApiUrl()}/bars/${barSlug}/settings`;
  try {
    return await fetchJson<BarSettingsResponse>(url, { cache: 'no-store' });
  } catch (error) {
    notFound();
    throw error instanceof Error ? error : new Error('Bar not found');
  }
}

/**
 * Render the quiz page for a specific bar identified by the route parameter.
 *
 * Loads the bar's settings and renders the page header (including optional intro text)
 * and the QuizFlow component configured for that bar.
 *
 * @param params - Route parameters object containing `barSlug`, the bar's slug
 * @returns The page JSX that displays the quiz for the specified bar
 */
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