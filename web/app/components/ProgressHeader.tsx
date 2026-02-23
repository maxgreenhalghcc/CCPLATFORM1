'use client';

import { motion, EASE, useMotionSafe } from '@/app/components/motion';
import { cn } from '@/lib/utils';

interface ProgressHeaderProps {
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  showBack?: boolean;
  className?: string;
}

export function ProgressHeader({
  currentStep,
  totalSteps,
  onBack,
  showBack = false,
  className,
}: ProgressHeaderProps) {
  const safe = useMotionSafe();
  const progressPct = Math.min((currentStep / totalSteps) * 100, 100);

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center gap-3">
        {/* Back button */}
        <div className="w-10 shrink-0">
          {showBack && onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-card/70 text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Step counter */}
        <span
          className="flex-1 text-center text-xs font-medium tabular-nums text-muted-foreground"
          aria-label={`Step ${currentStep} of ${totalSteps}`}
        >
          {currentStep} / {totalSteps}
        </span>

        {/* Spacer to balance back button */}
        <div className="w-10 shrink-0" aria-hidden="true" />
      </div>

      {/* Progress bar */}
      <div
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={0}
        aria-valuemax={totalSteps}
        aria-label="Quiz progress"
        className="h-1 w-full overflow-hidden rounded-full bg-border/60"
      >
        <motion.div
          className="h-full rounded-full bg-primary"
          style={{
            boxShadow: '0 0 8px hsl(var(--primary) / var(--glow-intensity))',
          }}
          animate={{ width: `${progressPct}%` }}
          transition={safe ? EASE.softSpring : { duration: 0 }}
        />
      </div>
    </div>
  );
}
