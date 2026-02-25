import dynamic from 'next/dynamic';
import { DashboardShell } from '@/app/components/DashboardShell';

const BarsClient = dynamic(() => import('./bars-client'), { ssr: false });

export default function AdminBarsPage() {
  return (
    <DashboardShell>
      <BarsClient />
    </DashboardShell>
  );
}
