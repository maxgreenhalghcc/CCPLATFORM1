'use client';

import { motion, useMotionSafe } from '@/app/components/motion';

interface ProgressProps {
  currentStep: number;
  totalSteps: number;
  label?: string;
}

export function Progress({ currentStep, totalSteps, label }: ProgressProps) {
  const safeCurrent = Math.min(Math.max(currentStep, 0), totalSteps);
  const progressPercentage = totalSteps === 0 ? 0 : Math.round((safeCurrent / totalSteps) * 100);
  const accessibleLabel = label ?? `Step ${safeCurrent} of ${totalSteps}`;
  const safe = useMotionSafe();

  return (
    <div className="space-y-2" aria-live="polite">
      <div
        role="progressbar"
        aria-valuenow={safeCurrent}
        aria-valuemin={0}
        aria-valuemax={totalSteps}
        aria-label={accessibleLabel}
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
      >
        <motion.div
          className="h-full rounded-full bg-primary"
          animate={{ width: `${progressPercentage}%` }}
          transition={
            safe
              ? { type: 'spring', stiffness: 300, damping: 30 }
              : { duration: 0 }
          }
        />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{accessibleLabel}</p>
    </div>
  );
}
