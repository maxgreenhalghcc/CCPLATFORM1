import dynamic from 'next/dynamic';

const BarEditorClient = dynamic(() => import('../bar-editor-client'), { ssr: false });

export default function NewBarPage() {
  return <BarEditorClient />;
}
