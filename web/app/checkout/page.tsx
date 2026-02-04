export default function CheckoutPlaceholderPage() {
  return (
    <div className="cc-page cc-page-section flex min-h-screen max-w-3xl flex-col gap-6">
      <h1 className="text-3xl font-semibold">Checkout placeholder</h1>
      <p className="text-muted-foreground">
        This page will redirect customers to Stripe Checkout once integrated. The actual checkout URL is provided by
        <code>{'/v1/orders/{id}/checkout'}</code>.
      </p>
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        <p>
          In development, use the Stripe CLI or dashboard to simulate `checkout.session.completed` events to the API webhook at
          `/v1/webhooks/stripe`.
        </p>
      </div>
    </div>
  );
}
