import type { IngestEventInput } from '@/lib/validation';

const BASE = 'https://app.ticketmaster.com/discovery/v2/events.json';

function mapType(name: string): IngestEventInput['event_type'] {
  const s = name.toLowerCase();
  if (s.includes('festival')) return 'festival';
  return 'other';
}

function bestImage(images?: any[]): string | null {
  if (!Array.isArray(images) || !images.length) return null;
  // prefere a maior imagem (16:9 quando possível)
  const sorted = [...images].sort((a, b) => (b.width ?? 0) - (a.width ?? 0));
  const wide = sorted.find((i) => i.ratio === '16_9');
  return (wide ?? sorted[0])?.url ?? null;
}

function toNum(v: any): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Vai buscar eventos de Dance/Electronic em Portugal à Discovery API da
 * Ticketmaster e converte-os para o formato de ingestão da app.
 * Requer a variável de ambiente TICKETMASTER_API_KEY.
 */
export async function fetchTicketmasterEvents(): Promise<IngestEventInput[]> {
  const key = process.env.TICKETMASTER_API_KEY;
  if (!key) throw new Error('Falta TICKETMASTER_API_KEY nas variáveis de ambiente');

  const params = new URLSearchParams({
    apikey: key,
    countryCode: 'PT',
    classificationName: 'Dance/Electronic',
    size: '100',
    sort: 'date,asc',
    startDateTime: new Date().toISOString().slice(0, 19) + 'Z',
  });

  const res = await fetch(`${BASE}?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Ticketmaster respondeu ${res.status}`);

  const data: any = await res.json();
  const list: any[] = data?._embedded?.events ?? [];
  const events: IngestEventInput[] = [];

  for (const e of list) {
    const title = e.name;
    const dt = e.dates?.start?.dateTime || e.dates?.start?.localDate;
    if (!title || !dt) continue;

    const venue = e._embedded?.venues?.[0];
    const price = Array.isArray(e.priceRanges) ? e.priceRanges[0] : undefined;
    const classification = Array.isArray(e.classifications) ? e.classifications[0] : undefined;
    const subGenre = classification?.subGenre?.name; // ex: "House", "Techno"

    events.push({
      title: String(title).slice(0, 160),
      description: e.info || e.pleaseNote || undefined,
      summary: undefined,
      date_start: String(dt),
      date_end: null,
      city: venue?.city?.name || undefined,
      country: 'Portugal',
      venue_name: venue?.name || undefined,
      venue_address: venue?.address?.line1 || undefined,
      organizer_name: e.promoter?.name || undefined,
      genre: subGenre || undefined, // tenta casar com os nossos géneros (House, Techno...)
      event_type: mapType(String(title)),
      is_festival: mapType(String(title)) === 'festival',
      price_min: toNum(price?.min) ?? null,
      price_max: toNum(price?.max) ?? null,
      ticket_url: e.url || null,
      source_url: e.url || null,
      image_url: bestImage(e.images),
      latitude: toNum(venue?.location?.latitude) ?? null,
      longitude: toNum(venue?.location?.longitude) ?? null,
      external_id: e.id != null ? `tm-${e.id}` : null,
      confidence_score: 0.85,
      source_name: 'Ticketmaster',
      raw_payload: e,
    });
  }

  return events;
}
