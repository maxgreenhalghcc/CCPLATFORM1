'use client';

interface ProgressProps {
  currentStep: number;
  totalSteps: number;
  label?: string;
}

/**
 * Render a styled, accessible progress bar reflecting the current step within the total steps.
 *
 * @param currentStep - The current step index or count; values are clamped to the range [0, totalSteps].
 * @param totalSteps - The total number of steps; when 0 the progress is treated as 0%.
 * @param label - Optional override for the accessible label shown visually and exposed via `aria-label`; defaults to `"Step {safeCurrent} of {totalSteps}"`.
 * @returns The JSX element for the progress bar with ARIA attributes (`aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label`) and a visible label.
 */
export function Progress({ currentStep, totalSteps, label }: ProgressProps) {
  const safeCurrent = Math.min(Math.max(currentStep, 0), totalSteps);
  const progressPercentage = totalSteps === 0 ? 0 : Math.round((safeCurrent / totalSteps) * 100);
  const accessibleLabel = label ?? `Step ${safeCurrent} of ${totalSteps}`;

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
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{accessibleLabel}</p>
    </div>
  );
}