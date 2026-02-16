'use client';

import { forwardRef } from 'react';
import { motion, EASE, useMotionSafe } from '@/app/components/motion';
import { cn } from '@/lib/utils';

interface OptionCardProps {
  label: string;
  description?: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  tabIndex?: number;
}

export const OptionCard = forwardRef<HTMLButtonElement, OptionCardProps>(
  ({ label, description, selected, onSelect, disabled, tabIndex }, ref) => {
    const safe = useMotionSafe();
    return (
      <motion.button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={selected}
        tabIndex={tabIndex}
        disabled={disabled}
        onClick={onSelect}
        animate={
          safe
            ? { scale: selected ? 1.02 : 1 }
            : undefined
        }
        whileTap={safe ? { scale: 0.97 } : undefined}
        transition={EASE.spring}
        className={cn(
          'group flex h-full flex-col rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          selected
            ? 'border-transparent bg-primary text-primary-foreground shadow-lg shadow-primary/40'
            : 'border-border bg-card/70 hover:border-primary/80 hover:bg-card'
        )}
      >
        <span className="text-base font-semibold leading-tight">{label}</span>
        {description ? (
          <span
            className={cn(
              'mt-2 text-sm leading-snug text-muted-foreground',
              selected && 'text-primary-foreground/90'
            )}
          >
            {description}
          </span>
        ) : null}
      </motion.button>
    );
  }
);

OptionCard.displayName = 'OptionCard';
