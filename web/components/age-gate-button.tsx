'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, DURATION, EASE, useMotionSafe } from '@/app/components/motion';

interface AgeGateButtonProps {
  href: string;
  className?: string;
}

export function AgeGateButton({
  href,
  className,
  children,
}: React.PropsWithChildren<AgeGateButtonProps>) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const safe = useMotionSafe();

  const handleYes = () => {
    setOpen(false);
    router.push(href as any);
  };

  const handleNo = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleNo();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="age-gate-backdrop"
              initial={safe ? { opacity: 0 } : undefined}
              animate={{ opacity: 1 }}
              exit={safe ? { opacity: 0 } : undefined}
              transition={{ duration: DURATION.micro, ease: EASE.out }}
              className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
              onClick={handleNo}
              aria-hidden="true"
            />

            {/* Panel — anchored to viewport centre via top-1/2 / -translate-y-1/2.
                Does not depend on flex layout or viewport height so it never
                shifts when the mobile address bar appears or disappears. */}
            <motion.div
              key="age-gate-panel"
              role="dialog"
              aria-modal="true"
              aria-labelledby="age-gate-title"
              initial={safe ? { opacity: 0, scale: 0.95 } : undefined}
              animate={{ opacity: 1, scale: 1 }}
              exit={safe ? { opacity: 0, scale: 0.95 } : undefined}
              transition={{ duration: DURATION.fast, ease: EASE.out }}
              onClick={(e) => e.stopPropagation()}
              className="fixed left-4 right-4 top-1/2 z-50 mx-auto max-w-sm -translate-y-1/2 rounded-2xl border border-border bg-card p-6 shadow-2xl"
            >
              <h2 id="age-gate-title" className="mb-2 text-lg font-semibold">
                Are you 18 or older?
              </h2>
              <p className="mb-6 text-sm text-muted-foreground">
                This experience builds alcoholic cocktails. Please confirm
                you&apos;re at least 18 years old to continue.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handleYes}
                  className="w-full rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-95"
                >
                  Yes, I&apos;m 18+
                </button>
                <button
                  type="button"
                  onClick={handleNo}
                  className="w-full rounded-full border border-border px-6 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted active:scale-95"
                >
                  No
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
