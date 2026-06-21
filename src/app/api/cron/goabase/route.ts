import { NextResponse, type NextRequest } from 'next/server';
import { fetchGoabaseEvents } from '@/lib/sources/goabase';
import { ingestEvents } from '@/lib/ingest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Recolha automática de eventos do Goabase (Portugal).
 * Chamado pelo agendamento da Vercel (ver vercel.json) — 1x por dia.
 *
 * Segurança: se a variável CRON_SECRET estiver definida, exige o header
 * `Authorization: Bearer <CRON_SECRET>` (a Vercel envia-o automaticamente nos
 * crons). Se não estiver definida, fica aberto (só importa eventos públicos
 * como 'pending', risco baixo).
 */
async function handle() {
  try {
    const events = await fetchGoabaseEvents();
    if (!events.length) {
      return NextResponse.json({ ok: true, source: 'goabase', found: 0, inserted: 0 });
    }
    const result = await ingestEvents(events);
    return NextResponse.json({ ok: true, source: 'goabase', found: events.length, ...result });
  } catch (e: any) {
    console.error('cron/goabase erro:', e?.message);
    return NextResponse.json({ ok: false, error: e?.message ?? 'erro' }, { status: 500 });
  }
}

function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // sem segredo definido → aberto
  const auth = req.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return handle();
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return handle();
}
