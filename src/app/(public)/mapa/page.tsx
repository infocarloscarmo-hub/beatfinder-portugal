import dynamic from 'next/dynamic';
import { getEvents } from '@/lib/queries';

export const revalidate = 0; // render a pedido (evita consulta ao Supabase no build)
export const metadata = { title: 'Mapa' };

const EventMap = dynamic(() => import('@/components/events/EventMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[70vh] items-center justify-center rounded-2xl border border-white/10 text-white/40">
      A carregar mapa…
    </div>
  ),
});

export default async function MapaPage() {
  const events = await getEvents({ limit: 500 });
  return (
    <div>
      <h1 className="mb-1 font-display text-3xl font-bold text-white">Mapa de eventos</h1>
      <p className="mb-6 text-white/50">Explora o que se passa perto de ti.</p>
      <EventMap events={events} />
    </div>
  );
}
