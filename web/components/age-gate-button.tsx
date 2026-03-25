'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, DURATION, EASE, useMotionSafe } from '@/app/components/motion';

interface AgeGateButtonProps {
  href: string;
  className?: string;
  panelClassName?: string;
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
            {/* Backdrop — separate layer so it never interferes with panel touch events */}
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

            {/* Panel — bottom sheet on mobile, centred card on sm+ */}
            <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4 pointer-events-none">
              <motion.div
                key="age-gate-panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="age-gate-title"
                initial={safe ? { opacity: 0, y: 32 } : undefined}
                animate={{ opacity: 1, y: 0 }}
                exit={safe ? { opacity: 0, y: 32 } : undefined}
                transition={{ duration: DURATION.fast, ease: EASE.out }}
                onClick={(e) => e.stopPropagation()}
                className="pointer-events-auto w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-border bg-card text-card-foreground px-6 pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:pb-6 shadow-2xl"
              >
                {/* Drag handle — mobile only */}
                <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-border sm:hidden" aria-hidden="true" />

                <h2 id="age-gate-title" className="text-lg font-semibold mb-2">
                  Are you 18 or older?
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  This experience builds alcoholic cocktails. Please confirm
                  you&apos;re at least 18 years old to continue.
                </p>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={handleNo}
                    className="w-full sm:w-auto px-6 py-3 rounded-full border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={handleYes}
                    className="w-full sm:w-auto px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
                  >
                    Yes, I&apos;m 18+
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
