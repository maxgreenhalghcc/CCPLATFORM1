import Link from 'next/link';
import { Button } from '@/components/ui/button';

type CancelPageProps = {
  searchParams?: {
    orderId?: string;
  };
};

/**
 * Render the checkout cancellation page that explains the checkout was not completed and provides next steps.
 *
 * @param searchParams - Optional query parameters from the URL. If `searchParams.orderId` is present, the page includes a "Return to receipt" action that links to `/receipt?orderId={orderId}`.
 * @returns A JSX element showing the cancellation message, an optional resume action when an orderId is available, and a note that a new Stripe link will be generated on reattempt.
 */
export default function CheckoutCancelPage({ searchParams }: CancelPageProps) {
  const orderId = searchParams?.orderId;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold">Checkout cancelled</h1>
        <p className="text-muted-foreground">
          No worries—your order hasn&apos;t been charged. You can revisit the quiz or try the payment again when you&apos;re ready.
        </p>
      </header>

      <section className="space-y-4 rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
        {orderId ? (
          <p>
            Want to resume the flow? We&apos;ll take you back to your receipt screen where you can re-open Stripe checkout.
            <br />
            <Button asChild className="mt-4" variant="outline">
              <Link href={`/receipt?orderId=${orderId}`}>Return to receipt</Link>
            </Button>
          </p>
        ) : (
          <p>
            Re-open the venue&apos;s QR code to restart the quiz or speak to a team member if you need assistance.
          </p>
        )}
        <p>
          The previous checkout session is void; if you reattempt payment we&apos;ll generate a fresh Stripe link automatically.
        </p>
      </section>
    </div>
  );
}