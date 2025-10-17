import dynamic from 'next/dynamic';

const BarsClient = dynamic(() => import('./bars-client'), { ssr: false });

export default function AdminBarsPage() {
  return <BarsClient />;
}
