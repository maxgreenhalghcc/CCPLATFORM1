'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { EASE, useMotionSafe } from '@/app/components/motion';
import { Button, type ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MotionButtonProps extends ButtonProps {
  glowOnHover?: boolean;
}

/**
 * Button with spring tap feedback and optional glow on hover.
 * Drop-in replacement for Button where tactile feel matters.
 */
export const MotionButton = React.forwardRef<HTMLButtonElement, MotionButtonProps>(
  ({ glowOnHover = false, className, ...props }, ref) => {
    const safe = useMotionSafe();

    return (
      <motion.div
        whileTap={safe && !props.disabled ? { scale: 0.985 } : undefined}
        whileHover={
          safe && glowOnHover && !props.disabled
            ? {
                boxShadow: '0 0 28px hsl(var(--primary) / calc(var(--glow-intensity) * 1.5))',
              }
            : undefined
        }
        transition={EASE.softSpring}
        className={cn('inline-flex w-full', className)}
        style={{ borderRadius: 'inherit' }}
      >
        <Button ref={ref} {...props} className="w-full" />
      </motion.div>
    );
  },
);
MotionButton.displayName = 'MotionButton';
