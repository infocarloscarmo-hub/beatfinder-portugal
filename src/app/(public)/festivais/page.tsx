import { getEvents } from '@/lib/queries';
import EventGrid from '@/components/events/EventGrid';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Festivais' };

export default async function FestivaisPage() {
  const events = await getEvents({ festivalsOnly: true });
  return (
    <div>
      <h1 className="mb-1 font-display text-3xl font-bold text-white">Festivais</h1>
      <p className="mb-6 text-white/50">Os grandes festivais de música eletrónica em Portugal.</p>
      <EventGrid events={events} empty={{ title: 'Sem festivais listados', icon: '🎪' }} />
    </div>
  );
}
