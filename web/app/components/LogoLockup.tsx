import Image from 'next/image';
import { cn } from '@/lib/utils';
import { FadeIn } from '@/app/components/motion';

type LockupMode = 'symbol-only' | 'horizontal' | 'stacked';
type LogoTreatment = 'none' | 'soft-badge' | 'glass-badge' | 'solid-badge';
type LogoSize = 'sm' | 'md' | 'lg';

interface LogoLockupProps {
  logoUrl?: string | null;
  barName: string;
  mode?: LockupMode;
  treatment?: LogoTreatment;
  size?: LogoSize;
  className?: string;
  delay?: number;
}

const sizeConfig: Record<LogoSize, { img: string; text: string; container: string }> = {
  sm: { img: 'h-8 w-auto max-w-[80px]', text: 'text-lg font-semibold', container: 'h-8' },
  md: { img: 'h-12 w-auto max-w-[120px]', text: 'text-2xl font-semibold', container: 'h-12' },
  lg: { img: 'h-16 w-auto max-w-[160px]', text: 'text-3xl font-semibold', container: 'h-16' },
};

const treatmentStyles: Record<LogoTreatment, string> = {
  none: '',
  'soft-badge': 'rounded-2xl bg-card/60 p-3 shadow-sm',
  'glass-badge':
    'rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-surface shadow-sm',
  'solid-badge': 'rounded-2xl bg-card p-3 shadow-md',
};

export function LogoLockup({
  logoUrl,
  barName,
  mode = 'symbol-only',
  treatment = 'none',
  size = 'md',
  className,
  delay = 0,
}: LogoLockupProps) {
  const { img: imgClass, text: textClass, container: containerClass } = sizeConfig[size];

  const logoElement = logoUrl ? (
    <div className={cn('relative flex items-center justify-center', containerClass)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt={barName}
        className={cn('object-contain', imgClass)}
      />
    </div>
  ) : (
    <span className={cn('font-display text-foreground', textClass)}>{barName}</span>
  );

  const nameElement =
    mode !== 'symbol-only' && logoUrl ? (
      <span className={cn('font-display text-foreground', textClass)}>{barName}</span>
    ) : null;

  const inner = (
    <div
      className={cn(
        'inline-flex items-center',
        mode === 'stacked' ? 'flex-col gap-2' : 'flex-row gap-3',
        treatmentStyles[treatment],
        className,
      )}
    >
      {logoElement}
      {nameElement}
    </div>
  );

  return <FadeIn delay={delay}>{inner}</FadeIn>;
}
