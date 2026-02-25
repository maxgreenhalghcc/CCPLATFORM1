import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DashboardShellProps {
  children: ReactNode;
  className?: string;
}

/**
 * Lightweight ambient background for admin/staff pages.
 * Lighter than AppShell — a single top-bloom radial gradient + noise texture,
 * no animated blobs, so data-heavy pages stay readable.
 * Reads the same CSS token variables (--glow-intensity, --texture-opacity) as AppShell.
 */
export function DashboardShell({ children, className }: DashboardShellProps) {
  return (
    <div className={cn('relative min-h-screen bg-background text-foreground', className)}>
      {/* Top radial bloom from primary colour — echoes the header area */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 40% at 50% 0%, hsl(var(--primary) / 0.18) 0%, transparent 65%)',
        }}
        aria-hidden="true"
      />

      {/* SVG noise/grain texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{ opacity: 'var(--texture-opacity)' }}
        aria-hidden="true"
      >
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <filter id="dash-noise-filter">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#dash-noise-filter)" />
        </svg>
      </div>

      {/* Content — above all background layers */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
