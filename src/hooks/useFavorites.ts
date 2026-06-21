'use client';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

const LS_KEY = 'bf_favorites';

/**
 * Gere favoritos. Se houver sessão, sincroniza com a tabela `favorites`
 * (via RPC toggle_favorite). Caso contrário, guarda em localStorage.
 */
export function useFavorites() {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [authed, setAuthed] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (user) {
        setAuthed(true);
        const { data } = await supabase.from('favorites').select('event_id');
        setIds(new Set((data ?? []).map((r) => r.event_id)));
      } else {
        const raw = typeof window !== 'undefined' ? localStorage.getItem(LS_KEY) : null;
        setIds(new Set(raw ? (JSON.parse(raw) as string[]) : []));
      }
    })();
    return () => { active = false; };
  }, [supabase]);

  const persistLocal = (next: Set<string>) =>
    localStorage.setItem(LS_KEY, JSON.stringify([...next]));

  const toggle = useCallback(
    async (eventId: string) => {
      setIds((prev) => {
        const next = new Set(prev);
        next.has(eventId) ? next.delete(eventId) : next.add(eventId);
        if (!authed) persistLocal(next);
        return next;
      });
      if (authed) {
        await supabase.rpc('toggle_favorite', { p_event_id: eventId });
      }
    },
    [authed, supabase]
  );

  return { ids, toggle, isFavorite: (id: string) => ids.has(id), authed };
}
