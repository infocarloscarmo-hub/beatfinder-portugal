import type { EventPublicRow } from '@/types/database.types';
import EventCard from './EventCard';
import { EmptyState } from '@/components/ui/EmptyState';

export default function EventGrid({
  events,
  empty,
}: {
  events: EventPublicRow[];
  empty?: { title: string; subtitle?: string; icon?: string };
}) {
  if (!events.length) {
    return (
      <EmptyState
        title={empty?.title ?? 'Sem eventos por agora'}
        subtitle={empty?.subtitle ?? 'Volta em breve — o radar está sempre a procurar.'}
        icon={empty?.icon ?? '🎧'}
      />
    );
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((e) => (
        <EventCard key={e.id} event={e} />
      ))}
    </div>
  );
}
