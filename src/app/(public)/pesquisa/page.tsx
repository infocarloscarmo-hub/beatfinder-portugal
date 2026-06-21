import { searchEvents } from '@/lib/queries';
import EventGrid from '@/components/events/EventGrid';
import SearchBar from '@/components/events/SearchBar';

export const metadata = { title: 'Pesquisa' };

export default async function PesquisaPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q?.trim() ?? '';
  const events = q ? await searchEvents(q) : [];
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-white">Pesquisa</h1>
      <div className="max-w-xl"><SearchBar initial={q} /></div>
      {q && <p className="text-sm text-white/50">{events.length} resultados para “{q}”.</p>}
      {q ? (
        <EventGrid events={events} empty={{ title: `Nada encontrado para “${q}”`, icon: '🔍' }} />
      ) : (
        <p className="text-white/40">Escreve algo para procurar eventos.</p>
      )}
    </div>
  );
}
