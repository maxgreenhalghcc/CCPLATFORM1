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
        animate={safe ? { scale: selected ? 1.02 : 1 } : undefined}
        whileTap={safe ? { scale: 0.97 } : undefined}
        transition={EASE.spring}
        className={cn(
          // Mobile: horizontal row
          'group flex w-full flex-row items-center gap-4 rounded-xl border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          // sm+: vertical card
          'sm:h-full sm:flex-col sm:items-start sm:rounded-2xl sm:p-4',
          selected
            ? 'border-transparent bg-primary text-primary-foreground shadow-lg shadow-primary/40'
            : 'border-border bg-card/70 hover:border-primary/80 hover:bg-card'
        )}
      >
        {/* Label + description */}
        <div className="flex flex-1 flex-col">
          <span className="text-base font-semibold leading-tight">{label}</span>
          {description ? (
            <span
              className={cn(
                'mt-0.5 text-xs leading-snug text-muted-foreground sm:mt-2 sm:text-sm',
                selected && 'text-primary-foreground/90'
              )}
            >
              {description}
            </span>
          ) : null}
        </div>

        {/* Selection indicator — mobile only */}
        <div
          className={cn(
            'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors sm:hidden',
            selected
              ? 'border-primary-foreground bg-primary-foreground/20'
              : 'border-border/60'
          )}
          aria-hidden="true"
        >
          {selected && (
            <svg
              viewBox="0 0 10 10"
              className="h-3 w-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="1.5,5 3.5,7.5 8.5,2.5" />
            </svg>
          )}
        </div>
      </motion.button>
    );
  }
);

OptionCard.displayName = 'OptionCard';
