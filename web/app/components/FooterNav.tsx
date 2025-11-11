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

/**
 * Render a responsive footer navigation with an optional back action and a primary action button.
 *
 * @param showBack - Whether to render the back button (preserves layout with a hidden placeholder when false)
 * @param onBack - Callback invoked when the back button is clicked
 * @param onNext - Callback invoked when the primary action button is clicked
 * @param nextLabel - Label for the primary action button
 * @param backLabel - Label for the back button (defaults to `"Back"`)
 * @param disabled - When true, disables the primary action button
 * @param isSubmitting - When true, replaces the primary button label with `"Mixing your cocktail…"`
 * @returns A React element containing the footer navigation markup
 */
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