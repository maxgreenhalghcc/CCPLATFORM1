import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import AdminFinancialsClient from './financials-client';
import { DashboardShell } from '@/app/components/DashboardShell';

export default async function AdminFinancialsPage() {
  const session = await auth();

  if (!session || session.user.role !== 'admin') {
    redirect(`/login?callbackUrl=${encodeURIComponent('/admin/financials')}`);
  }

  return (
    <DashboardShell>
      <AdminFinancialsClient />
    </DashboardShell>
  );
}
