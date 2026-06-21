import { NextResponse, type NextRequest } from 'next/server';
import { revalidatePath } from 'next/cache';

/** Permite ao n8n/admin invalidar o cache ISR após novos eventos. */
export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (!process.env.REVALIDATE_SECRET || secret !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  for (const p of ['/', '/eventos', '/hoje', '/fim-de-semana', '/festivais', '/mapa']) {
    revalidatePath(p);
  }
  return NextResponse.json({ revalidated: true, at: Date.now() });
}
