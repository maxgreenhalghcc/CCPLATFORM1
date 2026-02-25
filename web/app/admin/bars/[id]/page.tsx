import dynamic from 'next/dynamic';
import { DashboardShell } from '@/app/components/DashboardShell';

const BarEditorClient = dynamic(() => import('../bar-editor-client'), { ssr: false });

interface BarDetailPageProps {
  params: { id: string };
}

export default function BarDetailPage({ params }: BarDetailPageProps) {
  return (
    <DashboardShell>
      <BarEditorClient barId={params.id} />
    </DashboardShell>
  );
}
