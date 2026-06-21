import { NextResponse, type NextRequest } from 'next/server';
import { fetchTicketmasterEvents } from '@/lib/sources/ticketmaster';
import { ingestEvents } from '@/lib/ingest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function handle() {
  try {
    const events = await fetchTicketmasterEvents();
    if (!events.length) {
      return NextResponse.json({ ok: true, source: 'ticketmaster', found: 0, inserted: 0 });
    }
    const result = await ingestEvents(events);
    return NextResponse.json({ ok: true, source: 'ticketmaster', found: events.length, ...result });
  } catch (e: any) {
    console.error('cron/ticketmaster erro:', e?.message);
    return NextResponse.json({ ok: false, error: e?.message ?? 'erro' }, { status: 500 });
  }
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
