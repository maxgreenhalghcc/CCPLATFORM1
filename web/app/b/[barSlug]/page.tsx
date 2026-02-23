import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchJson, getApiUrl } from '@/lib/utils';
import { AgeGateButton } from '@/components/age-gate-button';
import { AppShell } from '@/app/components/AppShell';
import { LogoLockup } from '@/app/components/LogoLockup';
import { GlowPulse, FadeIn, StaggerChildren, StaggerItem } from '@/app/components/motion';
import { MotionButton } from '@/components/ui/motion-button';

interface BarSettingsResponse {
  name: string;
  slug: string;
  location?: string | null;
  introText?: string | null;
  outroText?: string | null;
  theme: Record<string, string>;
  pricingPounds?: number | null;
  logoUrl?: string | null;
  logoLockupMode?: string | null;
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
    <AppShell>
      <div className="mx-auto flex min-h-screen w-full max-w-sm flex-col items-center justify-center gap-10 px-6 py-16">
        <LogoLockup
          delay={0}
          size="md"
          mode="symbol-only"
          treatment="glass-badge"
          logoUrl={bar.logoUrl}
          barName={bar.name}
        />

        <FadeIn delay={0.1} className="flex flex-col items-center gap-3 text-center">
          <h1 className="text-3xl font-display font-semibold tracking-tight text-foreground">
            {bar.name}
          </h1>
          <p className="text-sm text-muted-foreground text-center max-w-xs">
            {bar.introText ?? 'A bespoke cocktail, crafted to your taste in under 3 minutes.'}
          </p>
        </FadeIn>

        <StaggerChildren>
          <div className="flex flex-wrap justify-center gap-2">
            <StaggerItem>
              <span className="rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground">3 minutes</span>
            </StaggerItem>
            <StaggerItem>
              <span className="rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground">9 questions</span>
            </StaggerItem>
            <StaggerItem>
              <span className="rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground">Bespoke recipe</span>
            </StaggerItem>
          </div>
        </StaggerChildren>

        <FadeIn delay={0.25} className="flex w-full flex-col gap-3">
          <GlowPulse className="w-full" idleDelay={1200}>
            <MotionButton variant="pill" size="xl" glowOnHover asChild>
              <AgeGateButton href={`/b/${bar.slug}/quiz`}>
                Start your cocktail quiz
              </AgeGateButton>
            </MotionButton>
          </GlowPulse>
          <p className="text-center text-xs text-muted-foreground">
            18+ only &middot;{' '}
            <Link href="/help" className="underline hover:text-foreground">
              How it works
            </Link>
          </p>
        </FadeIn>

        {bar.outroText && (
          <footer className="text-center text-xs text-muted-foreground">{bar.outroText}</footer>
        )}
      </div>
    </AppShell>
  );
}
