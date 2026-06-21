import type { IngestEventInput } from '@/lib/validation';

const GOABASE_URL = 'https://www.goabase.net/api/party/json/?country=Portugal';

// Mapeia o tipo do Goabase → event_type da nossa app
function mapType(t?: string): IngestEventInput['event_type'] {
  const s = (t ?? '').toLowerCase();
  if (s.includes('festival')) return 'festival';
  if (s.includes('open') || s.includes('outdoor')) return 'open_air';
  if (s.includes('club') || s.includes('indoor')) return 'club';
  return 'other';
}

function toNum(v: any): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

// Só aceita coordenadas plausíveis para Portugal (continente + ilhas).
// O Goabase às vezes tem geo a 0,0 ou errado.
function ptGeo(lat?: number, lon?: number): { lat: number | null; lon: number | null } {
  if (
    lat != null && lon != null &&
    lat >= 30 && lat <= 43 &&
    lon >= -33 && lon <= -6 &&
    !(lat === 0 && lon === 0)
  ) {
    return { lat, lon };
  }
  return { lat: null, lon: null };
}

/**
 * Vai buscar os eventos de Portugal ao Goabase e converte-os para o formato
 * de ingestão da app. Campos confirmados a partir da API real (chave `partylist`).
 */
export async function fetchGoabaseEvents(): Promise<IngestEventInput[]> {
  const res = await fetch(GOABASE_URL, {
    headers: { Accept: 'application/json', 'User-Agent': 'BeatfinderPortugal/1.0' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Goabase respondeu ${res.status}`);

  const data: any = await res.json();
  const list: any[] = data.partylist || (Array.isArray(data) ? data : []) || [];

  const now = Date.now();
  const events: IngestEventInput[] = [];

  for (const p of list) {
    const title = p.nameParty;
    const dateStart = p.dateStart;
    if (!title || !dateStart) continue;

    // só eventos futuros (margem de 1 dia)
    const start = new Date(dateStart).getTime();
    if (Number.isFinite(start) && start < now - 24 * 3600 * 1000) continue;

    const geo = ptGeo(toNum(p.geoLat), toNum(p.geoLon));
    const image = p.urlImageLarge || p.urlImageFull || p.urlImageMedium || p.urlImageSmall || null;

    events.push({
      title: String(title).slice(0, 160),
      description: undefined,
      summary: undefined,
      date_start: String(dateStart),
      date_end: p.dateEnd || null,
      city: p.nameTown || undefined,
      country: 'Portugal',
      venue_name: undefined, // Goabase não dá sala na lista; fica a cidade
      organizer_name: p.nameOrganizer || undefined,
      genre: undefined, // psytrance/goa — classificar no admin
      event_type: mapType(p.nameType),
      is_festival: mapType(p.nameType) === 'festival',
      ticket_url: null,
      source_url: p.urlPartyHtml || (p.id ? `https://www.goabase.net/party/${p.id}` : null),
      image_url: image,
      latitude: geo.lat,
      longitude: geo.lon,
      external_id: p.id != null ? `goabase-${p.id}` : null,
      confidence_score: 0.7,
      source_name: 'Goabase',
      raw_payload: p,
    });
  }

  return events;
}
