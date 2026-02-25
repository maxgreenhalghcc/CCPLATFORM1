'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion, DURATION, EASE, useMotionSafe } from '@/app/components/motion';

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
  const safe = useMotionSafe();

  const handleClick = () => setOpen(true);

  const handleYes = () => {
    setOpen(false);
    router.push(href as any);
  };

  const handleNo = () => {
    setOpen(false);
  };

  // Close on Escape key
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
      <button type="button" onClick={handleClick} className={className}>
        {children}
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={safe ? { opacity: 0 } : undefined}
              animate={{ opacity: 1 }}
              exit={safe ? { opacity: 0 } : undefined}
              transition={{ duration: DURATION.micro, ease: EASE.out }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
              onClick={handleNo}
              aria-hidden="true"
            />

            {/* Panel */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="age-gate-title"
              initial={safe ? { opacity: 0, scale: 0.96 } : undefined}
              animate={{ opacity: 1, scale: 1 }}
              exit={safe ? { opacity: 0, scale: 0.96 } : undefined}
              transition={EASE.softSpring}
              onClick={(e) => e.stopPropagation()}
              className={
                'fixed inset-0 z-50 flex items-center justify-center pointer-events-none'
              }
            >
              <div
                className={
                  panelClassName ??
                  'pointer-events-auto w-full max-w-md rounded-3xl bg-card text-card-foreground p-6 shadow-2xl border border-border'
                }
              >
                <h2 id="age-gate-title" className="text-lg font-semibold mb-2">
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
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
