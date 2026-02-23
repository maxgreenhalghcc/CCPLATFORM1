'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, DURATION, EASE, LiftIn, useMotionSafe } from '@/app/components/motion';
import { cn } from '@/lib/utils';

interface CraftingStateCardProps {
  barName: string;
  flavourKeywords?: string[];
  visible: boolean;
  /** Minimum visible duration in ms before onDismiss can fire */
  minDuration?: number;
  onDismiss?: () => void;
}

// Maps quiz answer values to friendly flavour descriptors shown during crafting
const KEYWORD_MAP: Record<string, string> = {
  // season
  spring: 'Fresh & Floral',
  summer: 'Bright & Citrusy',
  autumn: 'Warm & Spiced',
  winter: 'Bold & Rich',
  // base spirit
  gin: 'Botanical',
  vodka: 'Clean & Crisp',
  rum: 'Sweet & Complex',
  tequila: 'Vibrant & Earthy',
  // aroma
  citrus: 'Zesty',
  floral: 'Delicate',
  woody: 'Smoky',
  sweet: 'Indulgent',
  // bitterness
  low: 'Smooth',
  medium: 'Balanced',
  high: 'Intense',
};

function KeywordCarousel({ keywords }: { keywords: string[] }) {
  const [index, setIndex] = useState(0);
  const safe = useMotionSafe();

  useEffect(() => {
    if (keywords.length <= 1) return;
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % keywords.length);
    }, 1600);
    return () => clearInterval(interval);
  }, [keywords.length]);

  return (
    <div className="relative h-7 overflow-hidden" aria-live="polite" aria-atomic="true">
      <AnimatePresence mode="wait">
        <motion.span
          key={keywords[index]}
          initial={safe ? { opacity: 0, y: 8 } : undefined}
          animate={{ opacity: 1, y: 0 }}
          exit={safe ? { opacity: 0, y: -8 } : undefined}
          transition={{ duration: DURATION.fast, ease: EASE.out }}
          className="absolute inset-0 flex items-center justify-center text-sm font-medium text-primary"
        >
          {keywords[index]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}

export function CraftingStateCard({
  barName,
  flavourKeywords = [],
  visible,
  minDuration = 1400,
  onDismiss,
}: CraftingStateCardProps) {
  const readyRef = useRef(false);
  const dismissPendingRef = useRef(false);
  const safe = useMotionSafe();

  // Enforce minimum display duration
  useEffect(() => {
    if (!visible) return;
    readyRef.current = false;
    const timer = setTimeout(() => {
      readyRef.current = true;
      if (dismissPendingRef.current && onDismiss) {
        navigator.vibrate?.(50);
        onDismiss();
      }
    }, minDuration);
    return () => clearTimeout(timer);
  }, [visible, minDuration, onDismiss]);

  // When visible becomes false, either dismiss immediately or defer
  useEffect(() => {
    if (visible) {
      dismissPendingRef.current = false;
      return;
    }
    if (readyRef.current) {
      navigator.vibrate?.(50);
      onDismiss?.();
    } else {
      dismissPendingRef.current = true;
    }
  }, [visible, onDismiss]);

  const resolvedKeywords =
    flavourKeywords.length > 0
      ? flavourKeywords
      : ['Crafting something special…'];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={safe ? { opacity: 0 } : undefined}
          animate={{ opacity: 1 }}
          exit={safe ? { opacity: 0 } : undefined}
          transition={{ duration: DURATION.micro, ease: EASE.out }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background"
          role="status"
          aria-label="Crafting your cocktail"
        >
          {/* Background bloom */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 70% 50% at 50% 50%, hsl(var(--primary) / calc(var(--glow-intensity) * 0.5)) 0%, transparent 70%)',
            }}
            aria-hidden="true"
          />

          {/* Center card */}
          <LiftIn delay={0.1} className="relative z-10 flex w-full max-w-xs flex-col items-center gap-6 px-6 text-center">
            {/* Pulsing gem/orb */}
            <motion.div
              animate={
                safe
                  ? {
                      scale: [1, 1.06, 1],
                      opacity: [0.7, 1, 0.7],
                    }
                  : undefined
              }
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{
                background: 'hsl(var(--primary) / 0.15)',
                boxShadow: '0 0 32px hsl(var(--primary) / var(--glow-intensity))',
              }}
              aria-hidden="true"
            >
              <motion.div
                animate={safe ? { rotate: 360 } : undefined}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                className="h-8 w-8 rounded-full border-2 border-primary/40 border-t-primary"
              />
            </motion.div>

            <div className="space-y-2">
              <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">
                Crafting your cocktail…
              </h2>
              <KeywordCarousel keywords={resolvedKeywords} />
            </div>

            {/* Shimmer progress bar */}
            <div className="h-0.5 w-48 overflow-hidden rounded-full bg-border">
              <motion.div
                className="h-full w-full origin-left bg-primary/60"
                animate={safe ? { scaleX: [0, 1] } : undefined}
                transition={{ duration: (minDuration / 1000) * 0.85, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>

            {barName && (
              <p className="text-xs text-muted-foreground">
                Using {barName}&apos;s ingredients
              </p>
            )}
          </LiftIn>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * Derive flavour keywords from quiz answers for display in CraftingStateCard.
 */
export function deriveFlavourKeywords(answers: Record<string, string>): string[] {
  const keywords: string[] = [];
  for (const value of Object.values(answers)) {
    const keyword = KEYWORD_MAP[value.toLowerCase()];
    if (keyword && !keywords.includes(keyword)) {
      keywords.push(keyword);
    }
  }
  return keywords.slice(0, 4);
}
