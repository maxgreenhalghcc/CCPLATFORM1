import dynamic from 'next/dynamic';

const BarEditorClient = dynamic(() => import('../bar-editor-client'), { ssr: false });

interface BarDetailPageProps {
  params: { id: string };
}

export default function BarDetailPage({ params }: BarDetailPageProps) {
  return <BarEditorClient barId={params.id} />;
}
