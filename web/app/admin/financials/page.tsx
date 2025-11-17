import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import AdminFinancialsClient from './financials-client';

export default async function AdminFinancialsPage() {
  const session = await auth();

  if (!session || session.user.role !== 'admin') {
    redirect(`/login?callbackUrl=${encodeURIComponent('/admin/financials')}`);
  }

  return <AdminFinancialsClient />;
}
