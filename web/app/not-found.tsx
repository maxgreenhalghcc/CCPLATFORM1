import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <div className="space-y-2">
        <h1 className="text-4xl font-semibold">Bar not found</h1>
        <p className="text-muted-foreground">
          We couldn&apos;t find the requested bar. Check the URL or return to the homepage to browse available venues.
        </p>
      </div>
      <Button asChild>
        <Link href="/">Go home</Link>
      </Button>
    </div>
  );
}
