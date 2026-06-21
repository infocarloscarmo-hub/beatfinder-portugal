import { createAdminClient } from '@/lib/supabase/admin';
import { slugify } from '@/lib/utils';
import type { IngestEventInput } from '@/lib/validation';

export interface IngestResult {
  received: number;
  inserted: number;
  results: { title: string; status: string }[];
}

/**
 * Insere/atualiza uma lista de eventos normalizados.
 * Usa o cliente admin (service_role) — só chamar a partir de código de servidor
 * de confiança (endpoint /api/ingest ou crons internos).
 * Os eventos entram com status='pending' (dedupe por source_url+external_id).
 */
export async function ingestEvents(items: IngestEventInput[]): Promise<IngestResult> {
  const supabase = createAdminClient();

  // Cache de géneros (slug/nome → id)
  const { data: genres } = await supabase.from('genres').select('id, name, slug');
  const genreMap = new Map<string, string>();
  (genres ?? []).forEach((g: any) => {
    genreMap.set(String(g.slug).toLowerCase(), g.id);
    genreMap.set(String(g.name).toLowerCase(), g.id);
  });

  const results: { title: string; status: string }[] = [];

  for (const ev of items) {
    try {
      // Venue
      let venue_id: string | null = null;
      if (ev.venue_name) {
        const { data: v } = await supabase
          .from('venues')
          .insert({
            name: ev.venue_name,
            address: ev.venue_address ?? null,
            city: ev.city ?? null,
            country: ev.country ?? 'Portugal',
            latitude: ev.latitude ?? null,
            longitude: ev.longitude ?? null,
          })
          .select('id')
          .single();
        venue_id = v?.id ?? null;
      }

      // Organizer
      let organizer_id: string | null = null;
      if (ev.organizer_name) {
        const { data: o } = await supabase
          .from('organizers')
          .insert({ name: ev.organizer_name })
          .select('id')
          .single();
        organizer_id = o?.id ?? null;
      }

      const genre_id = ev.genre ? genreMap.get(ev.genre.toLowerCase()) ?? null : null;
      const slug = `${slugify(ev.title)}-${(ev.external_id ?? Date.now().toString(36)).slice(-8)}`;

      const row = {
        title: ev.title,
        slug,
        description: ev.description ?? null,
        summary: ev.summary ?? null,
        date_start: new Date(ev.date_start).toISOString(),
        date_end: ev.date_end ? new Date(ev.date_end).toISOString() : null,
        city: ev.city ?? null,
        country: ev.country ?? 'Portugal',
        venue_id,
        organizer_id,
        genre_id,
        event_type: ev.event_type ?? 'club',
        is_festival: ev.is_festival ?? ev.event_type === 'festival',
        price_min: ev.price_min ?? null,
        price_max: ev.price_max ?? null,
        ticket_url: ev.ticket_url ?? null,
        source_url: ev.source_url ?? null,
        image_url: ev.image_url ?? null,
        latitude: ev.latitude ?? null,
        longitude: ev.longitude ?? null,
        external_id: ev.external_id ?? null,
        confidence_score: ev.confidence_score ?? 0.5,
        raw_payload: ev.raw_payload ?? null,
        status: 'pending' as const,
      };

      const { error } =
        ev.external_id && ev.source_url
          ? await supabase
              .from('events')
              .upsert(row, { onConflict: 'source_url,external_id', ignoreDuplicates: false })
          : await supabase.from('events').insert(row);

      results.push({ title: ev.title, status: error ? `error: ${error.message}` : 'ok' });
    } catch (e: any) {
      results.push({ title: ev.title, status: `error: ${e?.message ?? 'unknown'}` });
    }
  }

  return {
    received: items.length,
    inserted: results.filter((r) => r.status === 'ok').length,
    results,
  };
}
