'use client';

import * as React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { getApiBaseUrl } from '@/app/lib/api';
import {
  AnimatePresence,
  motion,
  StaggerChildren,
  StaggerItem,
  DURATION,
  EASE,
} from '@/app/components/motion';

type SuccessClientProps = {
  orderId: string;
  recipePreviewTitle?: string;
};

export default function CheckoutSuccessClient({
  orderId,
  recipePreviewTitle = 'Your custom cocktail',
}: SuccessClientProps) {
  const [contact, setContact] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact.trim() || saving) return;

    setSaving(true);
    setSaved(false);
    setError(null);

    try {
      const res = await fetch(`${getApiBaseUrl()}/orders/${orderId}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contact: contact.trim() }),
      });

      if (!res.ok) {
        console.error('Failed to save contact', res.status);
        setError('We could not save your details. Please try again.');
        return;
      }

      setSaved(true);
    } catch (err) {
      console.error('Error saving contact', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <StaggerChildren className="grid gap-8 md:grid-cols-2">
      {/* LEFT: blurred recipe preview */}
      <StaggerItem>
        <section className="space-y-4 rounded-2xl border bg-card p-6">
          <p className="text-xs font-medium tracking-wide text-muted-foreground">
            YOUR RECIPE
          </p>
          <h2 className="text-2xl font-semibold">{recipePreviewTitle}</h2>
          <div className="mt-6 space-y-3">
            <div className="h-3 w-5/6 rounded-full animate-shimmer" />
            <div className="h-3 w-4/6 rounded-full animate-shimmer" />
            <div className="h-3 w-3/5 rounded-full animate-shimmer" />
            <div className="mt-4 flex gap-3">
              <div className="h-3 w-1/3 rounded-full animate-shimmer" />
              <div className="h-3 w-1/4 rounded-full animate-shimmer" />
            </div>
            <div className="h-3 w-1/2 rounded-full animate-shimmer" />
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            The full recipe will unlock once you confirm how you&apos;d like it
            sent to you.
          </p>
        </section>
      </StaggerItem>

      {/* RIGHT: unlock form */}
      <StaggerItem>
        <section className="space-y-4 rounded-2xl border bg-card p-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Unlock your recipe</h2>
            <p className="text-sm text-muted-foreground">
              Drop an email address or mobile number to unlock a copy of your
              recipe.
            </p>
          </div>

          <form onSubmit={handleSaveContact} className="space-y-4">
            <div className="space-y-2">
              <label
                htmlFor="contact"
                className="text-xs font-medium text-muted-foreground"
              >
                Email or phone number
              </label>
              <input
                id="contact"
                type="text"
                inputMode="email"
                autoComplete="email"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border/70 bg-background px-4 py-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                placeholder="you@example.com"
              />
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.p
                  key="error"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: DURATION.micro, ease: EASE.out }}
                  className="text-sm font-medium text-destructive"
                >
                  {error}
                </motion.p>
              )}
              {saved && !error && (
                <motion.p
                  key="success"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: DURATION.micro, ease: EASE.out }}
                  className="text-sm text-emerald-400"
                >
                  Got it — we&apos;ll send your recipe to {contact.trim()} as soon
                  as it&apos;s ready.
                </motion.p>
              )}
            </AnimatePresence>

            <Button
              type="submit"
              className="w-full"
              disabled={saving || !contact.trim()}
            >
              {saving ? 'Saving…' : 'Send me my recipe'}
            </Button>
          </form>
        </section>
      </StaggerItem>
    </StaggerChildren>
  );
}
