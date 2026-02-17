'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface AgeGateButtonProps {
  href: string;                 // where to go if user is 18+
  className?: string;           // button styling (comes from <Button asChild>)
  panelClassName?: string;      // optional override per bar
}

export function AgeGateButton({
  href,
  className,
  panelClassName,
  children,
}: React.PropsWithChildren<AgeGateButtonProps>) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleClick = () => setOpen(true);

  const handleYes = () => {
    setOpen(false);
    router.push(href);
  };

  const handleNo = () => {
    // later we'll route to mocktails – for now just close
    setOpen(false);
  };

  return (
    <>
      <button type="button" onClick={handleClick} className={className}>
        {children}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div
            className={
              panelClassName ??
              'w-full max-w-md rounded-3xl bg-card text-card-foreground p-6 shadow-2xl border border-border'
            }
          >
            <h2 className="text-lg font-semibold mb-2">
              Are you 18 or older?
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              This experience builds alcoholic cocktails. Please confirm
              you&apos;re at least 18 years old to continue.
            </p>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={handleNo}
                className="px-4 py-2 rounded-full border border-border text-sm text-muted-foreground hover:bg-muted"
              >
                No
              </button>
              <button
                type="button"
                onClick={handleYes}
                className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90"
              >
                Yes, I&apos;m 18+
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
