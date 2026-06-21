import { NextResponse, type NextRequest } from 'next/server';
import { fetchGoabaseEvents } from '@/lib/sources/goabase';
import { fetchTicketmasterEvents } from '@/lib/sources/ticketmaster';
import { ingestEvents } from '@/lib/ingest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Recolha de TODAS as fontes (chamado pelo agendamento da Vercel — ver vercel.json).
 * Cada fonte é independente: se uma falhar, as outras continuam.
 */
async function handle() {
  const sources: { name: string; fn: () => Promise<any[]> }[] = [
    { name: 'goabase', fn: fetchGoabaseEvents },
    { name: 'ticketmaster', fn: fetchTicketmasterEvents },
  ];

  const summary: any[] = [];
  for (const s of sources) {
    try {
      const events = await s.fn();
      const result = events.length
        ? await ingestEvents(events)
        : { received: 0, inserted: 0, results: [] };
      summary.push({ source: s.name, found: events.length, inserted: result.inserted });
    } catch (e: any) {
      summary.push({ source: s.name, error: e?.message ?? 'erro' });
    }
  }

  return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), sources: summary });
}

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return handle();
}
export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return handle();
}
