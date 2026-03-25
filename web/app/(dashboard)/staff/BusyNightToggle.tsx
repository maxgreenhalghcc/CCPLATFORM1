'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getApiBaseUrl } from '@/app/lib/api';

interface BusyNightToggleProps {
  barId: string;
  initialPaused: boolean;
  apiToken?: string;
}

export function BusyNightToggle({ barId, initialPaused, apiToken }: BusyNightToggleProps) {
  const [paused, setPaused] = useState(initialPaused);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    const next = !paused;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${getApiBaseUrl()}/v1/bars/${barId}/settings/quiz-paused`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(apiToken ? { Authorization: `Bearer ${apiToken}` } : {}),
          },
          body: JSON.stringify({ quizPaused: next }),
        },
      );

      if (!res.ok) throw new Error(`Request failed: ${res.status}`);

      setPaused(next);
    } catch {
      setError('Could not update. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={toggle}
        disabled={loading}
        aria-pressed={paused}
        className={[
          'flex items-center justify-between rounded-xl border px-5 py-4 text-left transition',
          paused
            ? 'border-destructive/50 bg-destructive/10 hover:bg-destructive/15'
            : 'border-border/60 bg-card/80 hover:border-primary/40',
          loading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        ].join(' ')}
      >
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-foreground">
            {paused ? 'Quiz paused — busy night mode on' : 'Quiz active'}
          </p>
          <p className="text-xs text-muted-foreground">
            {paused
              ? 'New guests cannot start the quiz. Staff dashboard stays live.'
              : 'Guests can scan and start the cocktail quiz.'}
          </p>
        </div>
        <div className="ml-4 flex-shrink-0">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            <div
              className={[
                'h-5 w-9 rounded-full transition-colors',
                paused ? 'bg-destructive' : 'bg-muted',
              ].join(' ')}
            >
              <div
                className={[
                  'mt-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform',
                  paused ? 'translate-x-4' : 'translate-x-0.5',
                ].join(' ')}
              />
            </div>
          )}
        </div>
      </button>

      {error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
