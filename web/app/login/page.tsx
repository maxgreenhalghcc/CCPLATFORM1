import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import LoginForm from './login-form';

interface LoginPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

/**
 * Render the sign-in page or redirect an authenticated user to the appropriate destination.
 *
 * The page shows a magic-link login form and informational text when there is no active session.
 * If a session exists, the user is redirected to `callbackUrl` (if provided) or to `/admin` for admins and `/staff` for other users.
 *
 * @param searchParams - Optional query parameters; `searchParams.callbackUrl` is used as the post-login destination when it is a string.
 * @returns The page's JSX when no session exists; otherwise navigation occurs via redirect.
 */
export default async function LoginPage({ searchParams }: LoginPageProps) {
  const session = await auth();
  const callbackParam = searchParams?.callbackUrl;
  const callbackUrl = typeof callbackParam === 'string' ? callbackParam : undefined;

  if (session) {
    const destination = callbackUrl ?? (session.user.role === 'admin' ? '/admin' : '/staff');
    redirect(destination);
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-8 px-6 py-16">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Enter your staff or admin email address. We&apos;ll send a magic link that signs you in instantly.
        </p>
        <p className="text-xs text-muted-foreground">
          In development the magic link is printed in the Next.js terminal output via Nodemailer&apos;s JSON transport.
        </p>
      </div>
      <LoginForm callbackUrl={callbackUrl} />
      <p className="text-center text-xs text-muted-foreground">
        Need access? Contact the platform administrator to have your email added to the system.
      </p>
      <p className="text-center text-xs text-muted-foreground">
        <Link className="underline" href="/">Return to homepage</Link>
      </p>
    </div>
  );
}