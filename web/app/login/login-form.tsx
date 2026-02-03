'use client';

import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';

interface LoginFormProps {
  callbackUrl?: string;
}

export default function LoginForm({ callbackUrl }: LoginFormProps) {
  const [mode, setMode] = useState<'email' | 'pin'>('email');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('pending');
    setMessage(null);

    if (mode === 'pin') {
      const result = await signIn('credentials', {
        pin,
        redirect: true,
        callbackUrl: callbackUrl ?? '/staff'
      });
      // NextAuth will redirect on success; if we get here it's likely an error.
      setStatus('error');
      setMessage((result as any)?.error ?? 'Invalid PIN.');
      return;
    }

    const result = await signIn('email', {
      email,
      redirect: false,
      callbackUrl: callbackUrl ?? '/staff'
    });

    if (result?.ok) {
      setStatus('sent');
      setMessage('Magic link sent! Check your inbox (or terminal output on dev).');
    } else {
      setStatus('error');
      setMessage(result?.error ?? 'Unable to send magic link. Try again.');
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === 'email' ? 'default' : 'secondary'}
          className="flex-1"
          onClick={() => {
            setMode('email');
            setMessage(null);
            setStatus('idle');
          }}
        >
          Email link
        </Button>
        <Button
          type="button"
          variant={mode === 'pin' ? 'default' : 'secondary'}
          className="flex-1"
          onClick={() => {
            setMode('pin');
            setMessage(null);
            setStatus('idle');
          }}
        >
          Staff PIN
        </Button>
      </div>

      {mode === 'email' ? (
        <label className="block text-sm font-medium">
          Staff or admin email
          <input
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="staff@demo.bar"
          />
        </label>
      ) : (
        <label className="block text-sm font-medium">
          Staff PIN
          <input
            className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
            type="password"
            required
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            placeholder="••••"
          />
        </label>
      )}

      <Button className="w-full" type="submit" disabled={status === 'pending'}>
        {status === 'pending' ? 'Please wait…' : mode === 'pin' ? 'Sign in' : 'Email me a login link'}
      </Button>

      {message ? (
        <p
          className={`text-sm ${status === 'error' ? 'text-destructive' : 'text-muted-foreground'}`}
          role={status === 'error' ? 'alert' : undefined}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
