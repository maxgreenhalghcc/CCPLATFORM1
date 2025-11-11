import dynamic from 'next/dynamic';

const BarsClient = dynamic(() => import('./bars-client'), { ssr: false });

/**
 * Renders the admin bars page using a client-only `BarsClient` component.
 *
 * @returns The React element for the admin bars page containing `BarsClient`.
 */
export default function AdminBarsPage() {
  return <BarsClient />;
}