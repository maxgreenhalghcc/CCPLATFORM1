'use client';

import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';

type Status = 'idle' | 'pending' | 'sent' | 'error';

export default function LoginPage() {
  const callbackUrl: string | undefined = undefined;
  const [mode, setMode] = useState<'email' | 'pin'>('email');

  const [email, setEmail] = useState('');
  const [slug, setSlug] = useState('demo-bar');
  const [pin, setPin] = useState('');

  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);

  // === EMAIL MAGIC LINK ===
  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('pending');
    setMessage(null);

    const result = await signIn('email', {
      email,
      redirect: false,
      callbackUrl: callbackUrl ?? '/admin',
    });

    if (result?.ok) {
      setStatus('sent');
      setMessage(
        'Link sent! Check your inbox for the login URL.'
      );
    } else {
      setStatus('error');
      setMessage(result?.error ?? 'Unable to send link. Try again.');
    }
  };

  // === STAFF PIN LOGIN ===
  const handlePinSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('pending');
    setMessage(null);

    await signIn('credentials', {
      slug,
      pin,
      callbackUrl: '/staff/orders',
    });
  };

  const isPending = status === 'pending';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm space-y-6">
        {/* Header */}
        <header className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Sign in to Custom Cocktails
          </h1>
          <p className="text-sm text-muted-foreground">
            Use your email magic link or your bar&apos;s staff PIN.
          </p>
        </header>

        {/* Toggle */}
        <div className="flex rounded-full bg-muted p-1 text-sm">
          <button
            type="button"
            onClick={() => {
              setMode('email');
              setStatus('idle');
              setMessage(null);
            }}
            className={`flex-1 py-2 rounded-full transition ${
              mode === 'email'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Email link
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('pin');
              setStatus('idle');
              setMessage(null);
            }}
            className={`flex-1 py-2 rounded-full transition ${
              mode === 'pin'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Staff PIN
          </button>
        </div>

        {/* EMAIL MODE */}
        {mode === 'email' && (
          <form className="space-y-4" onSubmit={handleEmailSubmit}>
            <div>
              <label className="block text-sm font-medium">
                Staff or admin email
                <input
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="staff@demo.bar"
                />
              </label>
            </div>

            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending ? 'Sending\u2026' : 'Email me a login link'}
            </Button>

            {message ? (
              <p
                className={`text-sm ${
                  status === 'error'
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                }`}
                role={status === 'error' ? 'alert' : undefined}
              >
                {message}
              </p>
            ) : null}
          </form>
        )}

        {/* PIN MODE */}
        {mode === 'pin' && (
          <form className="space-y-4" onSubmit={handlePinSubmit}>
            <div className="space-y-3">
              <label className="block text-sm font-medium">
                Bar slug
                <input
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                  type="text"
                  required
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  placeholder="demo-bar"
                />
              </label>

              <label className="block text-sm font-medium">
                Staff PIN
                <input
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
                  type="password"
                  inputMode="numeric"
                  required
                  value={pin}
                  onChange={(event) => setPin(event.target.value)}
                  placeholder="1234"
                />
              </label>
            </div>

            <Button className="w-full" type="submit" disabled={isPending}>
              {isPending ? 'Signing in\u2026' : 'Sign in to staff orders'}
            </Button>

            {message ? (
              <p
                className={`text-sm ${
                  status === 'error'
                    ? 'text-destructive'
                    : 'text-muted-foreground'
                }`}
                role={status === 'error' ? 'alert' : undefined}
              >
                {message}
              </p>
            ) : null}
          </form>
        )}
      </div>
    </div>
  );
}
