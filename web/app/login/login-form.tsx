'use client';

import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';

interface LoginFormProps {
  callbackUrl?: string;
}

export default function LoginForm({ callbackUrl }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'pending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus('pending');
    setMessage(null);

    const result = await signIn('email', {
      email,
      redirect: false,
      callbackUrl: callbackUrl ?? '/staff'
    });

    if (result?.ok) {
      setStatus('sent');
      setMessage('Magic link sent! Check the Next.js terminal output for the login URL.');
    } else {
      setStatus('error');
      setMessage(result?.error ?? 'Unable to send magic link. Try again.');
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
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
      <Button className="w-full" type="submit" disabled={status === 'pending'}>
        {status === 'pending' ? 'Sending…' : 'Email me a login link'}
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
