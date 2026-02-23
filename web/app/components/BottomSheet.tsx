'use client';

import { ReactNode, useEffect, useRef } from 'react';
import { motion, AnimatePresence, DURATION, EASE, useMotionSafe } from '@/app/components/motion';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

export function BottomSheet({ open, onClose, title, children, className }: BottomSheetProps) {
  const safe = useMotionSafe();
  const sheetRef = useRef<HTMLDivElement>(null);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={safe ? { opacity: 0 } : undefined}
            animate={{ opacity: 1 }}
            exit={safe ? { opacity: 0 } : undefined}
            transition={{ duration: DURATION.micro }}
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-md"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={safe ? { y: '100%', opacity: 0.8 } : undefined}
            animate={{ y: 0, opacity: 1 }}
            exit={safe ? { y: '100%', opacity: 0.8 } : undefined}
            transition={{ duration: DURATION.normal, ease: EASE.out }}
            className={cn(
              'fixed bottom-0 left-0 right-0 z-50 flex max-h-[85dvh] flex-col rounded-t-3xl border border-border/40 bg-card shadow-2xl focus:outline-none',
              className,
            )}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) onClose();
            }}
          >
            {/* Drag handle */}
            <div className="flex shrink-0 justify-center py-3" aria-hidden="true">
              <div className="h-1 w-10 rounded-full bg-border" />
            </div>

            {title && (
              <p className="shrink-0 px-6 pb-2 text-lg font-semibold text-foreground">{title}</p>
            )}

            <div className="flex-1 overflow-y-auto px-6 pb-8">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
