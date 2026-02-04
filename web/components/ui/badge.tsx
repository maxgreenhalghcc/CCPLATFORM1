import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'cc-chip border border-border/60 bg-background/40 text-foreground/90',
  {
    variants: {
      variant: {
        default: '',
        muted: 'bg-muted text-muted-foreground border-border/40',
        primary: 'bg-primary/10 text-primary border-primary/20',
        success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
        warning: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
        destructive: 'bg-destructive/10 text-destructive border-destructive/25',
      },
      size: {
        sm: 'text-xs px-2.5 py-1',
        md: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}
