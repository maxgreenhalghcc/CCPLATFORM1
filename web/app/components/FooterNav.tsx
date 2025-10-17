'use client';

import { Button } from '@/components/ui/button';

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
  isSubmitting
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
        className="w-full sm:w-auto"
      >
        {isSubmitting ? 'Mixing your cocktail…' : nextLabel}
      </Button>
    </div>
  );
}
