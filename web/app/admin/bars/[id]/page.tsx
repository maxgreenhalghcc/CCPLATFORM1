import dynamic from 'next/dynamic';

const BarEditorClient = dynamic(() => import('../bar-editor-client'), { ssr: false });

interface BarDetailPageProps {
  params: { id: string };
}

/**
 * Render the BarEditorClient for the bar specified by the route parameters.
 *
 * @param params - Route parameters object containing `id`, the identifier of the bar to edit.
 * @returns A React element that renders the bar editor for the given `id`.
 */
export default function BarDetailPage({ params }: BarDetailPageProps) {
  return <BarEditorClient barId={params.id} />;
}