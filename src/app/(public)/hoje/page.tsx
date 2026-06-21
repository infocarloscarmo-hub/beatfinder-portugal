import { getEvents } from '@/lib/queries';
import { todayRange } from '@/lib/dates';
import EventGrid from '@/components/events/EventGrid';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Eventos hoje' };

export default async function HojePage() {
  const { start, end } = todayRange();
  const events = await getEvents({ from: start, to: end });
  return (
    <div>
      <h1 className="mb-1 font-display text-3xl font-bold text-white">Eventos hoje</h1>
      <p className="mb-6 text-white/50">O que se passa esta noite em Portugal.</p>
      <EventGrid events={events} empty={{ title: 'Nada para hoje', subtitle: 'Espreita o fim de semana.' }} />
    </div>
  );
}
