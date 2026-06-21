'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useFavorites } from '@/hooks/useFavorites';
import EventGrid from '@/components/events/EventGrid';
import type { EventPublicRow } from '@/types/database.types';

export default function FavoritesClient() {
  const { ids } = useFavorites();
  const [events, setEvents] = useState<EventPublicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      const list = [...ids];
      if (!list.length) { setEvents([]); setLoading(false); return; }
      const { data } = await supabase
        .from('events_public')
        .select('*')
        .in('id', list)
        .order('date_start', { ascending: true });
      setEvents(data ?? []);
      setLoading(false);
    })();
  }, [ids, supabase]);

  if (loading) return <p className="text-white/40">A carregar…</p>;
  return (
    <EventGrid
      events={events}
      empty={{ title: 'Ainda sem favoritos', subtitle: 'Toca no coração de um evento para o guardares.', }}
    />
  );
}
