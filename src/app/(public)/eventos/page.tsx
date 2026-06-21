import { getEvents, getGenres } from '@/lib/queries';
import EventGrid from '@/components/events/EventGrid';
import EventFilters from '@/components/events/EventFilters';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Eventos' };

export default async function EventosPage({
  searchParams,
}: {
  searchParams: { city?: string; genre?: string; type?: string; priceMax?: string };
}) {
  const [genres, events] = await Promise.all([
    getGenres(),
    getEvents({
      city: searchParams.city,
      genre: searchParams.genre,
      type: searchParams.type,
      priceMax: searchParams.priceMax ? Number(searchParams.priceMax) : undefined,
    }),
  ]);

  return (
    <div className="space-y-2">
      <h1 className="font-display text-3xl font-bold text-white">Todos os eventos</h1>
      <p className="mb-4 text-white/50">{events.length} eventos encontrados</p>
      <EventFilters genres={genres} />
      <EventGrid events={events} empty={{ title: 'Nenhum evento corresponde aos filtros' }} />
    </div>
  );
}
