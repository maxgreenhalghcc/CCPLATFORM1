import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import AdminFinancialsClient from './financials-client';

/**
 * Render the admin financials page and enforce server-side admin access.
 *
 * @returns The `AdminFinancialsClient` React element when the current session user has the `admin` role; otherwise triggers a redirect to the login page with a callback URL to `/admin/financials`.
 */
export default async function AdminFinancialsPage() {
  const session = await auth();

  if (!session || session.user.role !== 'admin') {
    redirect(`/login?callbackUrl=${encodeURIComponent('/admin/financials')}`);
  }

  return <AdminFinancialsClient />;
}