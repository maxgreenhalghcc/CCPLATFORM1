import dynamic from 'next/dynamic';

const BarEditorClient = dynamic(() => import('../bar-editor-client'), { ssr: false });

/**
 * Render the client-only bar editor page used to create a new bar.
 *
 * @returns A JSX element that renders the dynamically imported `BarEditorClient` component with server-side rendering disabled.
 */
export default function NewBarPage() {
  return <BarEditorClient />;
}