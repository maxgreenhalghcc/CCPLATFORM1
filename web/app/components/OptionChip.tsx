'use client';

import { motion, EASE, ScaleIn, useMotionSafe } from '@/app/components/motion';
import { cn } from '@/lib/utils';

interface OptionChipProps {
  label: string;
  value: string;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export function OptionChip({ label, value, selected, onSelect, disabled }: OptionChipProps) {
  const safe = useMotionSafe();

  return (
    <motion.button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      layout
      animate={
        safe
          ? {
              scale: selected ? 1.03 : 1,
              boxShadow: selected
                ? '0 0 16px hsl(var(--primary) / var(--glow-intensity))'
                : '0 0 0px transparent',
            }
          : undefined
      }
      whileTap={safe ? { scale: 0.96 } : undefined}
      transition={EASE.softSpring}
      className={cn(
        'relative inline-flex min-h-[44px] items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40',
        selected
          ? 'border-transparent bg-primary text-primary-foreground'
          : 'border-border bg-card/70 text-foreground hover:border-primary/60 hover:bg-card',
      )}
    >
      {selected && (
        <ScaleIn className="flex h-4 w-4 shrink-0 items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 16 16"
            fill="currentColor"
            className="h-3.5 w-3.5"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.431-6.647a.75.75 0 0 1 1.102-.3Z"
              clipRule="evenodd"
            />
          </svg>
        </ScaleIn>
      )}
      {label}
    </motion.button>
  );
}
