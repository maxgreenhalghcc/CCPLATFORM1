import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface QuestionStepLayoutProps {
  header: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  className?: string;
}

/**
 * Layout shell for quiz question screens.
 * Keeps header and footer stable; only content slot animates between steps.
 */
export function QuestionStepLayout({
  header,
  children,
  footer,
  className,
}: QuestionStepLayoutProps) {
  return (
    <div
      className={cn(
        'flex min-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex-col px-5 pb-6 pt-5',
        className,
      )}
    >
      {/* Persistent header — not re-rendered between steps */}
      <div className="shrink-0">{header}</div>

      {/* Scrollable content area */}
      <div className="mt-6 flex flex-1 flex-col gap-4 overflow-y-auto">{children}</div>

      {/* Sticky footer CTA */}
      <div className="mt-auto shrink-0 pt-6">{footer}</div>
    </div>
  );
}
