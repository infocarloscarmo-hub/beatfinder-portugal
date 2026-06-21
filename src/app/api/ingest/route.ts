import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { ingestBatchSchema, ingestEventSchema } from '@/lib/validation';
import { slugify } from '@/lib/utils';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Endpoint de ingestão automática para o n8n.
 *
 * Autenticação: header `x-api-key: <INGEST_API_KEY>` ou `Authorization: Bearer <...>`.
 * Aceita um único evento ({...}) ou um lote ({ events: [...] }).
 * Os eventos entram com status='pending' para revisão no painel admin.
 * Dedupe por (source_url, external_id) via upsert.
 */
export async function POST(req: NextRequest) {
  // 1) Auth
  const key =
    req.headers.get('x-api-key') ??
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (!process.env.INGEST_API_KEY || key !== process.env.INGEST_API_KEY) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // 2) Body → normaliza para array
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const batch = Array.isArray((body as any)?.events)
    ? ingestBatchSchema.safeParse(body)
    : ingestEventSchema.safeParse(body);

  if (!batch.success) {
    return NextResponse.json(
      { error: 'validation', issues: batch.error.issues },
      { status: 422 }
    );
  }

  const items =
    'events' in (batch.data as any)
      ? (batch.data as any).events
      : [batch.data];

  const supabase = createAdminClient();

  // 3) Resolve géneros (cache simples por slug/nome)
  const { data: genres } = await supabase.from('genres').select('id, name, slug');
  const genreMap = new Map<string, string>();
  (genres ?? []).forEach((g) => {
    genreMap.set(g.slug.toLowerCase(), g.id);
    genreMap.set(g.name.toLowerCase(), g.id);
  });

  const results: { title: string; status: string }[] = [];

  for (const ev of items) {
    // Venue (cria se vier nome)
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

    const genre_id = ev.genre
      ? genreMap.get(ev.genre.toLowerCase()) ?? null
      : null;

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

    // Upsert por (source_url, external_id) quando há external_id
    const { error } =
      ev.external_id && ev.source_url
        ? await supabase
            .from('events')
            .upsert(row, { onConflict: 'source_url,external_id', ignoreDuplicates: false })
        : await supabase.from('events').insert(row);

    results.push({ title: ev.title, status: error ? `error: ${error.message}` : 'ok' });
  }

  const okCount = results.filter((r) => r.status === 'ok').length;
  return NextResponse.json({ received: items.length, inserted: okCount, results });
}

export async function GET() {
  return NextResponse.json({ ok: true, hint: 'POST eventos com header x-api-key' });
}
