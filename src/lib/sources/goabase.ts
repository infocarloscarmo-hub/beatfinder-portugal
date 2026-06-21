import type { IngestEventInput } from '@/lib/validation';

const GOABASE_URL = 'https://www.goabase.net/api/party/json/?country=Portugal';

// Mapeia o tipo do Goabase → event_type da nossa app
function mapType(t?: string): IngestEventInput['event_type'] {
  const s = (t ?? '').toLowerCase();
  if (s.includes('festival')) return 'festival';
  if (s.includes('open')) return 'open_air';
  if (s.includes('club')) return 'club';
  return 'other';
}

/** Lê um campo tentando vários nomes possíveis (a API pode variar). */
function pick(obj: any, keys: string[]): any {
  for (const k of keys) {
    if (obj && obj[k] != null && obj[k] !== '') return obj[k];
  }
  return undefined;
}

function toNum(v: any): number | undefined {
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/**
 * Vai buscar os eventos de Portugal ao Goabase e converte-os para o formato
 * de ingestão da app. Defensivo quanto aos nomes dos campos.
 */
export async function fetchGoabaseEvents(): Promise<IngestEventInput[]> {
  const res = await fetch(GOABASE_URL, {
    headers: { Accept: 'application/json', 'User-Agent': 'BeatfinderPortugal/1.0' },
    // sem cache — queremos sempre o mais recente
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Goabase respondeu ${res.status}`);

  const data: any = await res.json();
  // A lista pode vir como array direto ou dentro de uma chave
  const list: any[] =
    (Array.isArray(data) && data) ||
    data.listParties ||
    data.parties ||
    data.results ||
    data.items ||
    [];

  const now = Date.now();
  const events: IngestEventInput[] = [];

  for (const p of list) {
    const title = pick(p, ['nameParty', 'name', 'title', 'partyName']);
    const dateStart = pick(p, ['dateStart', 'startDate', 'dateFrom', 'date']);
    if (!title || !dateStart) continue;

    // só eventos futuros
    const start = new Date(dateStart).getTime();
    if (Number.isFinite(start) && start < now - 24 * 3600 * 1000) continue;

    const id = pick(p, ['idParty', 'id', 'partyId', 'uid']);

    events.push({
      title: String(title).slice(0, 160),
      summary: undefined,
      description: pick(p, ['textMore', 'description', 'textTeaser', 'text']) || undefined,
      date_start: String(dateStart),
      date_end: pick(p, ['dateEnd', 'endDate', 'dateTo']) || null,
      city: pick(p, ['nameTown', 'town', 'city', 'locationTown']) || undefined,
      country: 'Portugal',
      venue_name: pick(p, ['nameLocation', 'location', 'venue', 'nameClub']) || undefined,
      organizer_name: pick(p, ['nameOrganizer', 'organizer', 'promoter']) || undefined,
      genre: undefined, // Goabase é sobretudo psy/goa; deixamos para classificar no admin
      event_type: mapType(pick(p, ['typeParty', 'type', 'eventType'])),
      is_festival: mapType(pick(p, ['typeParty', 'type', 'eventType'])) === 'festival',
      ticket_url: pick(p, ['urlTicket', 'ticketUrl']) || null,
      source_url: pick(p, ['urlParty', 'url', 'link', 'urlGoabase']) || `https://www.goabase.net/party/${id ?? ''}`,
      image_url: pick(p, ['urlImage', 'image', 'imageUrl', 'urlImageFull']) || null,
      latitude: toNum(pick(p, ['geoLat', 'lat', 'latitude'])) ?? null,
      longitude: toNum(pick(p, ['geoLon', 'lng', 'lon', 'longitude'])) ?? null,
      external_id: id != null ? `goabase-${id}` : null,
      confidence_score: 0.7,
      source_name: 'Goabase',
      raw_payload: p,
    });
  }

  return events;
}
