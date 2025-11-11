import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { MainNav } from '@/components/navigation/main-nav';

/**
 * Renders the application's homepage containing the main navigation, a centered hero section with a badge, heading, description, and two CTA buttons linking to a sample bar and the admin console.
 *
 * @returns The React element for the homepage layout including navigation, hero content, and navigation CTAs.
 */
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MainNav />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-8 px-6 py-16 text-center">
        <span className="rounded-full bg-muted px-4 py-1 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Custom Cocktails Platform
        </span>
        <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-6xl">
          Personalised cocktail experiences for every bar.
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Configure branded quiz flows, generate deterministic cocktail recipes, and give staff the tools to fulfil orders fast.
          This repository contains the monorepo scaffolding for the Custom Cocktails MVP.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/b/sample-bar">Explore sample bar</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/admin">Admin console</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}