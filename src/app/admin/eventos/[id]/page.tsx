import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { updateEvent } from '@/app/admin/actions';
import { EVENT_TYPES } from '@/lib/constants';
import { ArrowLeft, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

// datetime-local quer 'YYYY-MM-DDTHH:mm'
function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function EditEventPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const [{ data: event }, { data: genres }] = await Promise.all([
    supabase.from('events').select('*').eq('id', params.id).maybeSingle(),
    supabase.from('genres').select('*').order('name'),
  ]);
  if (!event) notFound();

  const action = updateEvent.bind(null, event.id);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/admin" className="mb-4 inline-flex items-center gap-1 text-sm text-white/50 hover:text-white">
        <ArrowLeft size={16} /> Voltar
      </Link>
      <h1 className="mb-1 font-display text-2xl font-bold text-white">Editar evento</h1>
      <p className="mb-2 text-sm text-white/50">Estado atual: <span className="text-white/80">{event.status}</span></p>
      {event.source_url && (
        <a href={event.source_url} target="_blank" rel="noopener noreferrer"
           className="mb-6 inline-flex items-center gap-1 text-sm text-neon-purple hover:underline">
          <ExternalLink size={14} /> Ver fonte original
        </a>
      )}

      <form action={action} className="card space-y-4 p-6">
        <div>
          <label className="label">Título</label>
          <input name="title" defaultValue={event.title} className="input" required />
        </div>
        <div>
          <label className="label">Resumo</label>
          <input name="summary" defaultValue={event.summary ?? ''} className="input" />
        </div>
        <div>
          <label className="label">Descrição</label>
          <textarea name="description" rows={4} defaultValue={event.description ?? ''} className="input" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Início</label>
            <input type="datetime-local" name="date_start" defaultValue={toLocalInput(event.date_start)} className="input" />
          </div>
          <div>
            <label className="label">Fim</label>
            <input type="datetime-local" name="date_end" defaultValue={toLocalInput(event.date_end)} className="input" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Cidade</label>
            <input name="city" defaultValue={event.city ?? ''} className="input" />
          </div>
          <div>
            <label className="label">Género</label>
            <select name="genre_id" defaultValue={event.genre_id ?? ''} className="input">
              <option value="">—</option>
              {(genres ?? []).map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Preço mín. (€)</label>
            <input type="number" step="0.5" name="price_min" defaultValue={event.price_min ?? ''} className="input" />
          </div>
          <div>
            <label className="label">Preço máx. (€)</label>
            <input type="number" step="0.5" name="price_max" defaultValue={event.price_max ?? ''} className="input" />
          </div>
        </div>
        <div>
          <label className="label">Link de bilhetes</label>
          <input name="ticket_url" defaultValue={event.ticket_url ?? ''} className="input" />
        </div>
        <div>
          <label className="label">Imagem (URL)</label>
          <input name="image_url" defaultValue={event.image_url ?? ''} className="input" />
        </div>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm text-white/80">
            <input type="checkbox" name="is_featured" defaultChecked={event.is_featured} className="h-4 w-4 accent-[#8b5cf6]" />
            Destacado (pago)
          </label>
          <label className="flex items-center gap-2 text-sm text-white/80">
            <input type="checkbox" name="is_festival" defaultChecked={event.is_festival} className="h-4 w-4 accent-[#8b5cf6]" />
            É festival
          </label>
        </div>
        <button type="submit" className="btn-primary w-full">Guardar alterações</button>
      </form>
    </div>
  );
}
