import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { fetchJson, getApiUrl } from '@/lib/utils';

interface RecipeResponse {
  name: string;
  description?: string | null;
  ingredients: unknown[];
  method?: string;
  glassware?: string;
  garnish?: string;
  warnings: unknown[];
}

interface ReceiptPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

function normalizeIngredient(entry: unknown): string {
  if (typeof entry === 'string') {
    return entry;
  }

  if (entry && typeof entry === 'object') {
    const { name, amount } = entry as { name?: unknown; amount?: unknown };
    const label = typeof name === 'string' && name.trim().length > 0 ? name.trim() : 'Ingredient';
    const measurement = typeof amount === 'string' && amount.trim().length > 0 ? amount.trim() : undefined;
    return measurement ? `${measurement} — ${label}` : label;
  }

  return 'Ingredient';
}

function normalizeWarnings(entries: unknown[]): string[] {
  return entries
    .map((entry) => (typeof entry === 'string' ? entry : null))
    .filter((warning): warning is string => Boolean(warning));
}

async function loadRecipe(orderId: string): Promise<RecipeResponse> {
  const url = `${getApiUrl()}/orders/${orderId}/recipe`;

  try {
    return await fetchJson<RecipeResponse>(url, { cache: 'no-store' });
  } catch (error) {
    notFound();
    throw error instanceof Error ? error : new Error('Recipe not found');
  }
}

export default async function ReceiptPage({ searchParams }: ReceiptPageProps) {
  const rawOrderId = searchParams?.orderId;
  const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : rawOrderId;

  if (!orderId) {
    notFound();
  }

  const recipe = await loadRecipe(orderId);
  const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients.map(normalizeIngredient) : [];
  const warnings = normalizeWarnings(Array.isArray(recipe.warnings) ? recipe.warnings : []);

  return (
    <div className="mx-auto min-h-screen w-full max-w-4xl px-6 py-16">
      <header className="space-y-3 text-center">
        <p className="text-xs uppercase tracking-[0.45em] text-muted-foreground">Your bespoke cocktail</p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">{recipe.name}</h1>
        {recipe.description ? (
          <p className="mx-auto max-w-2xl text-pretty text-sm text-muted-foreground sm:text-base">
            {recipe.description}
          </p>
        ) : null}
      </header>

      <section className="mt-12 grid gap-8 rounded-3xl border border-border/60 bg-card/80 p-10 shadow-lg shadow-primary/10 backdrop-blur">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Ingredients</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            {ingredients.length > 0 ? (
              ingredients.map((item) => (
                <li key={item} className="rounded-xl border border-border/40 bg-background/80 px-4 py-3 text-foreground">
                  {item}
                </li>
              ))
            ) : (
              <li className="text-muted-foreground">Ingredients will be confirmed by the bar team.</li>
            )}
          </ul>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <article className="rounded-2xl border border-border/40 bg-background/70 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Method</h3>
            <p className="mt-3 text-sm leading-relaxed text-foreground">
              {recipe.method && recipe.method.trim().length > 0
                ? recipe.method
                : 'The bartending team will prepare this to perfection as soon as your order is confirmed.'}
            </p>
          </article>
          <article className="rounded-2xl border border-border/40 bg-background/70 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Presentation</h3>
            <dl className="mt-3 space-y-2 text-sm text-foreground">
              <div>
                <dt className="font-medium text-muted-foreground">Glassware</dt>
                <dd>{recipe.glassware && recipe.glassware.trim().length > 0 ? recipe.glassware : "Bartender's choice"}</dd>
              </div>
              <div>
                <dt className="font-medium text-muted-foreground">Garnish</dt>
                <dd>{recipe.garnish && recipe.garnish.trim().length > 0 ? recipe.garnish : 'Surprise garnish'}</dd>
              </div>
            </dl>
          </article>
        </div>

        {warnings.length > 0 ? (
          <aside className="rounded-2xl border border-border/40 bg-background/70 p-6">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Allergy & dietary notes</h3>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-foreground">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </aside>
        ) : null}
      </section>

      <div className="mt-12 flex flex-col items-center gap-4 text-center">
        <p className="text-sm text-muted-foreground">
          Show this page to the bar team when you arrive—they&apos;ll see the full order linked to #{orderId}.
        </p>
        <Button asChild variant="outline">
          <Link href="/">Return home</Link>
        </Button>
      </div>
    </div>
  );
}
