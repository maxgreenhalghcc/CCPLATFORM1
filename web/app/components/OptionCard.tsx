'use client';

import { cn } from '@/lib/utils';

interface OptionCardProps {
  label: string;
  description?: string | null;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  tabIndex?: number;
}

export function OptionCard({
  label,
  description,
  selected = false,
  disabled = false,
  onSelect,
  tabIndex,
}: OptionCardProps) {
  return (
    <button
      type="button"
      tabIndex={tabIndex}
      disabled={disabled}
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        'flex w-full flex-col items-start rounded-2xl border px-6 py-5 text-left transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        selected
          ? 'border-primary bg-primary text-primary-foreground shadow-lg'
          : 'border-border/60 bg-card/80 hover:border-primary/60 hover:bg-card'
      )}
    >
      <span className="text-base font-medium">{label}</span>
      {description ? (
        <span className="mt-1 text-sm text-muted-foreground">
          {description}
        </span>
      ) : null}
    </button>
  );
}
