'use client';

import { Button } from '@/components/ui/button';
import { AnimatePresence, motion, DURATION } from '@/app/components/motion';

interface FooterNavProps {
  showBack: boolean;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel: string;
  backLabel?: string;
  disabled?: boolean;
  isSubmitting?: boolean;
}

export function FooterNav({
  showBack,
  onBack,
  onNext,
  nextLabel,
  backLabel = 'Back',
  disabled,
  isSubmitting,
}: FooterNavProps) {
  return (
    <div className="flex flex-col gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
      {showBack ? (
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="sm:w-auto"
        >
          {backLabel}
        </Button>
      ) : (
        <span className="text-sm text-muted-foreground" aria-hidden>
          &nbsp;
        </span>
      )}
      <Button
        type="button"
        onClick={onNext}
        disabled={disabled}
        className="relative w-full sm:w-auto"
      >
        <AnimatePresence mode="wait" initial={false}>
          {isSubmitting ? (
            <motion.span
              key="spinner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION.micro }}
              className="flex items-center gap-2"
            >
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: 'linear' }}
                className="inline-block h-4 w-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground"
              />
              Mixing your cocktail…
            </motion.span>
          ) : (
            <motion.span
              key="label"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DURATION.micro }}
            >
              {nextLabel}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    </div>
  );
}
