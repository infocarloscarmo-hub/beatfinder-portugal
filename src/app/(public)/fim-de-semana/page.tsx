import { getEvents } from '@/lib/queries';
import { weekendRange } from '@/lib/dates';
import EventGrid from '@/components/events/EventGrid';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Este fim de semana' };

export default async function FimDeSemanaPage() {
  const { start, end } = weekendRange();
  const events = await getEvents({ from: start, to: end });
  return (
    <div>
      <h1 className="mb-1 font-display text-3xl font-bold text-white">Este fim de semana</h1>
      <p className="mb-6 text-white/50">Sexta a domingo — planeia já.</p>
      <EventGrid events={events} empty={{ title: 'Sem eventos este fim de semana' }} />
    </div>
  );
}
