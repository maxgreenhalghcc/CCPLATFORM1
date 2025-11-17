import CheckoutSuccessClient from './success-client';

type SuccessPageProps = {
  searchParams?: {
    orderId?: string | string[];
  };
};

export default function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  // Normalise orderId to a single string
  const raw = searchParams?.orderId;
  const orderId = Array.isArray(raw) ? raw[0] : raw ?? '';

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-8 px-6 py-16">
      <header className="space-y-3">
        <p className="text-sm font-medium text-emerald-400">Payment confirmed</p>
        {orderId && (
          <p className="text-xs text-muted-foreground">
            Order ID:{' '}
            <span className="font-mono">
              {orderId}
            </span>
          </p>
        )}
        <h1 className="text-4xl font-semibold leading-tight">
          We&apos;re crafting your custom cocktail
        </h1>
      </header>

      {orderId ? (
        <CheckoutSuccessClient
          orderId={orderId}
          recipePreviewTitle="Your custom cocktail"
        />
      ) : (
        <section className="rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
          <p>
            We couldn&apos;t detect an order reference in the URL. If you
            reached this page by mistake, return to the venue&apos;s QR code and
            try again, or ask a member of staff for help.
          </p>
        </section>
      )}

      <footer className="mt-auto text-center text-xs text-muted-foreground">
        Webhooks usually update the staff dashboard within a few seconds. If the
        order stays pending for more than a minute, staff can retry the refresh
        in their console.
      </footer>
    </div>
  );
}
