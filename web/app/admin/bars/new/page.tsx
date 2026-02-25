import dynamic from 'next/dynamic';
import { DashboardShell } from '@/app/components/DashboardShell';

const BarEditorClient = dynamic(() => import('../bar-editor-client'), { ssr: false });

export default function NewBarPage() {
  return (
    <DashboardShell>
      <BarEditorClient />
    </DashboardShell>
  );
}
