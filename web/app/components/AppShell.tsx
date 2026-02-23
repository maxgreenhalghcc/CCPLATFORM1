import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AppShellProps {
  children: ReactNode;
  className?: string;
}

/**
 * Layered ambient background system.
 * Reads CSS token variables (--glow-intensity, --surface-blur, --texture-opacity)
 * set by the bar theme + preset, producing a premium layered background feel.
 */
export function AppShell({ children, className }: AppShellProps) {
  return (
    <div className={cn('relative min-h-screen overflow-hidden bg-background text-foreground', className)}>
      {/* Radial gradient bloom from primary colour */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% -10%, hsl(var(--primary) / calc(var(--glow-intensity) * 0.6)) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* Ambient glow blob — top-left */}
      <div
        className="animate-ambient-drift pointer-events-none absolute -left-32 -top-32 z-0 h-96 w-96 rounded-full"
        style={{
          background: `radial-gradient(circle, hsl(var(--primary) / var(--glow-intensity)) 0%, transparent 70%)`,
          filter: `blur(var(--surface-blur))`,
          animationDelay: '0s',
        }}
        aria-hidden="true"
      />

      {/* Ambient glow blob — bottom-right */}
      <div
        className="animate-ambient-drift pointer-events-none absolute -bottom-24 -right-24 z-0 h-72 w-72 rounded-full"
        style={{
          background: `radial-gradient(circle, hsl(var(--accent) / calc(var(--glow-intensity) * 0.7)) 0%, transparent 70%)`,
          filter: `blur(var(--surface-blur))`,
          animationDelay: '-6s',
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
          <filter id="noise-filter">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.65"
              numOctaves="3"
              stitchTiles="stitch"
            />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise-filter)" />
        </svg>
      </div>

      {/* Content — above all background layers */}
      <div className="relative z-10">{children}</div>
    </div>
  );
}
