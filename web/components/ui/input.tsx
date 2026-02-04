import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

/**
 * Opinionated input for the platform.
 * Uses global .cc-input tokens (spacing, focus ring) and adds error affordances.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, hasError = false, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'cc-input',
          hasError
            ? 'border-destructive/60 focus:ring-destructive/70'
            : 'border-border',
          className
        )}
        aria-invalid={hasError || undefined}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export function Field({
  label,
  helper,
  error,
  children,
  className,
}: {
  label: string;
  helper?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={cn('block text-sm font-medium', className)}>
      <span className="text-sm">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-destructive" role="alert">
          {error}
        </span>
      ) : helper ? (
        <span className="mt-1 block text-xs text-muted-foreground">{helper}</span>
      ) : null}
    </label>
  );
}
