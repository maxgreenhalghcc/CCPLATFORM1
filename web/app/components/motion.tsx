'use client';

import {
  type HTMLMotionProps,
  type Variants,
  motion,
  AnimatePresence,
  useReducedMotion,
} from 'framer-motion';
import { forwardRef, type ReactNode } from 'react';

// ── Shared duration / easing tokens ──────────────────────────────────
export const DURATION = {
  micro: 0.2,
  normal: 0.35,
  slow: 0.5,
} as const;

export const EASE = {
  out: [0.16, 1, 0.3, 1] as const,
  inOut: [0.45, 0, 0.55, 1] as const,
  spring: { type: 'spring' as const, stiffness: 400, damping: 30 },
} as const;

// ── Reduced-motion helper ────────────────────────────────────────────
export function useMotionSafe() {
  const prefersReduced = useReducedMotion();
  return !prefersReduced;
}

// ── FadeIn ───────────────────────────────────────────────────────────
interface FadeInProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export const FadeIn = forwardRef<HTMLDivElement, FadeInProps>(
  ({ children, delay = 0, className, ...rest }, ref) => {
    const safe = useMotionSafe();
    return (
      <motion.div
        ref={ref}
        initial={safe ? { opacity: 0, y: 8 } : undefined}
        animate={{ opacity: 1, y: 0 }}
        exit={safe ? { opacity: 0, y: -4 } : undefined}
        transition={{ duration: DURATION.normal, delay, ease: EASE.out }}
        className={className}
        {...rest}
      >
        {children}
      </motion.div>
    );
  }
);
FadeIn.displayName = 'FadeIn';

// ── SlideIn ──────────────────────────────────────────────────────────
type SlideDirection = 'left' | 'right' | 'up' | 'down';

interface SlideInProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  direction?: SlideDirection;
  delay?: number;
  className?: string;
}

const slideOffsets: Record<SlideDirection, { x: number; y: number }> = {
  left: { x: -24, y: 0 },
  right: { x: 24, y: 0 },
  up: { x: 0, y: -16 },
  down: { x: 0, y: 16 },
};

export const SlideIn = forwardRef<HTMLDivElement, SlideInProps>(
  ({ children, direction = 'up', delay = 0, className, ...rest }, ref) => {
    const safe = useMotionSafe();
    const offset = slideOffsets[direction];
    return (
      <motion.div
        ref={ref}
        initial={safe ? { opacity: 0, ...offset } : undefined}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={safe ? { opacity: 0, ...offset } : undefined}
        transition={{ duration: DURATION.normal, delay, ease: EASE.out }}
        className={className}
        {...rest}
      >
        {children}
      </motion.div>
    );
  }
);
SlideIn.displayName = 'SlideIn';

// ── StaggerChildren ─────────────────────────────────────────────────
interface StaggerChildrenProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}

export const staggerItemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.normal, ease: EASE.out },
  },
};

export function StaggerChildren({
  children,
  staggerDelay = 0.06,
  className,
}: StaggerChildrenProps) {
  const safe = useMotionSafe();
  return (
    <motion.div
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: safe ? staggerDelay : 0 } },
      }}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ── StaggerItem ─────────────────────────────────────────────────────
export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div variants={staggerItemVariants} className={className}>
      {children}
    </motion.div>
  );
}

// Re-export framer-motion essentials
export { motion, AnimatePresence };
