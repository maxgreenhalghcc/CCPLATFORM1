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
    <QuizFlow barSlug={bar.slug} barName={bar.name} outroText={bar.outroText ?? undefined} />
  );
}
