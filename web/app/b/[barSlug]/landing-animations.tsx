'use client';

import { FadeIn, StaggerChildren, StaggerItem } from '@/app/components/motion';
import type { ReactNode } from 'react';

export function AnimatedHero({ children }: { children: ReactNode }) {
  return <FadeIn delay={0.1}>{children}</FadeIn>;
}

export function AnimatedCTA({ children }: { children: ReactNode }) {
  return <FadeIn delay={0.25}>{children}</FadeIn>;
}

export function AnimatedStats({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <StaggerChildren className={className}>{children}</StaggerChildren>;
}

export function AnimatedStat({ children }: { children: ReactNode }) {
  return <StaggerItem>{children}</StaggerItem>;
}
