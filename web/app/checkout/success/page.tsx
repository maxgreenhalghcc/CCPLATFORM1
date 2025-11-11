import Link from 'next/link';
import { Button } from '@/components/ui/button';

type SuccessPageProps = {
  searchParams?: {
    orderId?: string;
  };
};

/**
 * Render the checkout success page showing payment confirmation and, when available, a link to the order receipt.
 *
 * @param searchParams - Optional query parameters; `orderId` (if present) is used to show a direct link to the receipt/recipe
 * @returns A React element for the checkout success screen with conditional receipt navigation
 */
export default function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const orderId = searchParams?.orderId;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-6 py-16">
      <header className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold">Payment received</h1>
        <p className="text-muted-foreground">
          Thanks for completing checkout! We&apos;re confirming your payment and preparing your custom recipe.
        </p>
      </header>

      <section className="space-y-4 rounded-2xl border bg-card p-6 text-sm text-muted-foreground">
        <p>
          It can take a few seconds for Stripe to notify our system. If your receipt doesn&apos;t appear straight away, refresh the
          page after a moment.
        </p>
        {orderId ? (
          <p>
            Ready to see your drink? Head to your receipt and share it with the bar team.
            <br />
            <Button asChild className="mt-4">
              <Link href={`/receipt?orderId=${orderId}`}>View my recipe</Link>
            </Button>
          </p>
        ) : (
          <p>
            We couldn&apos;t detect an order reference in the URL. Return to the venue&apos;s QR code or contact staff if you need help.
          </p>
        )}
      </section>

      <footer className="text-center text-sm text-muted-foreground">
        Webhooks usually update the staff dashboard within a few seconds. If the order stays pending for more than a minute,
        staff can retry the refresh in their console.
      </footer>
    </div>
  );
}