'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const safe = useMotionSafe();

  // Wait for client mount before portalling (avoids SSR mismatch)
  useEffect(() => {
    setMounted(true);
  }, []);

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

  const modal = (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop — rendered at document.body so no transform ancestor can
              shift its position. */}
          <motion.div
            key="age-gate-backdrop"
            initial={safe ? { opacity: 0 } : undefined}
            animate={{ opacity: 1 }}
            exit={safe ? { opacity: 0 } : undefined}
            transition={{ duration: DURATION.micro, ease: EASE.out }}
            style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
            className="bg-background/80 backdrop-blur-sm"
            onClick={handleNo}
            aria-hidden="true"
          />

          {/* Panel — fixed to viewport centre; immune to any transform context
              because it lives directly under document.body. */}
          <motion.div
            key="age-gate-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="age-gate-title"
            initial={safe ? { opacity: 0, scale: 0.95 } : undefined}
            animate={{ opacity: 1, scale: 1 }}
            exit={safe ? { opacity: 0, scale: 0.95 } : undefined}
            transition={{ duration: DURATION.fast, ease: EASE.out }}
            transformTemplate={({ scale }) =>
              `translate(-50%, -50%) scale(${scale ?? 1})`
            }
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              zIndex: 9999,
              width: 'calc(100% - 2rem)',
              maxWidth: '24rem',
            }}
            className="rounded-2xl border border-border bg-card p-6 shadow-2xl"
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
  );

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>

      {mounted ? createPortal(modal, document.body) : null}
    </>
  );
}
