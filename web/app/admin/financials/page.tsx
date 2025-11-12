import { redirect } from 'next/navigation';
<<<<<<< HEAD
import { getServerSession } from "next-auth";
import { authOptions } from "@/auth";
import AdminFinancialsClient from './financials-client';

export default async function AdminFinancialsPage() {
  const session = await getServerSession(authOptions);
=======
import { auth } from '@/auth';
import AdminFinancialsClient from './financials-client';

export default async function AdminFinancialsPage() {
  const session = await auth();
>>>>>>> pr-22

  if (!session || session.user.role !== 'admin') {
    redirect(`/login?callbackUrl=${encodeURIComponent('/admin/financials')}`);
  }

  return <AdminFinancialsClient />;
}
