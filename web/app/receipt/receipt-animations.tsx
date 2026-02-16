'use client';

import { FadeIn, StaggerChildren, StaggerItem } from '@/app/components/motion';
import type { ReactNode } from 'react';

export function AnimatedRecipeHeader({ children }: { children: ReactNode }) {
  return <FadeIn delay={0.1}>{children}</FadeIn>;
}

export function AnimatedRecipeBody({ children }: { children: ReactNode }) {
  return <FadeIn delay={0.2}>{children}</FadeIn>;
}

export function AnimatedIngredientList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <StaggerChildren className={className}>{children}</StaggerChildren>
  );
}

export function AnimatedIngredient({ children }: { children: ReactNode }) {
  return <StaggerItem>{children}</StaggerItem>;
}
