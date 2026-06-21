'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { submitEvent, type SubmitResult } from './actions';
import { EVENT_TYPES } from '@/lib/constants';
import type { GenreRow } from '@/types/database.types';
import { CheckCircle2, AlertCircle } from 'lucide-react';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn-primary w-full">
      {pending ? 'A enviar…' : 'Submeter evento'}
    </button>
  );
}

export default function SubmitForm({ genres }: { genres: GenreRow[] }) {
  const [state, formAction] = useFormState<SubmitResult | null, FormData>(submitEvent, null);

  if (state?.ok) {
    return (
      <div className="card flex flex-col items-center gap-3 p-10 text-center">
        <CheckCircle2 className="text-neon-lime" size={40} />
        <p className="text-lg font-semibold text-white">{state.message}</p>
        <a href="/eventos" className="btn-ghost mt-2">Ver eventos</a>
      </div>
    );
  }

  const err = (k: string) => state?.errors?.[k];

  return (
    <form action={formAction} className="card space-y-4 p-6">
      {state && !state.ok && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          <AlertCircle size={16} /> {state.message}
        </div>
      )}

      <div>
        <label className="label">Título *</label>
        <input name="title" className="input" placeholder="Ex: Boris Brejcha @ LX Factory" required />
        {err('title') && <p className="mt-1 text-xs text-red-400">{err('title')}</p>}
      </div>

      <div>
        <label className="label">Resumo</label>
        <input name="summary" className="input" placeholder="Uma frase sobre o evento" />
      </div>

      <div>
        <label className="label">Descrição</label>
        <textarea name="description" rows={4} className="input" placeholder="Line-up, detalhes…" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Início *</label>
          <input type="datetime-local" name="date_start" className="input" required />
          {err('date_start') && <p className="mt-1 text-xs text-red-400">{err('date_start')}</p>}
        </div>
        <div>
          <label className="label">Fim</label>
          <input type="datetime-local" name="date_end" className="input" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Cidade *</label>
          <input name="city" className="input" placeholder="Lisboa" required />
          {err('city') && <p className="mt-1 text-xs text-red-400">{err('city')}</p>}
        </div>
        <div>
          <label className="label">Local / Sala</label>
          <input name="venue_name" className="input" placeholder="Lux Frágil" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Género</label>
          <select name="genre_id" className="input" defaultValue="">
            <option value="">—</option>
            {genres.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Tipo</label>
          <select name="event_type" className="input" defaultValue="club">
            {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Preço mín. (€)</label>
          <input type="number" name="price_min" min={0} step="0.5" className="input" placeholder="0" />
        </div>
        <div>
          <label className="label">Preço máx. (€)</label>
          <input type="number" name="price_max" min={0} step="0.5" className="input" />
        </div>
      </div>

      <div>
        <label className="label">Link de bilhetes</label>
        <input name="ticket_url" className="input" placeholder="https://…" />
        {err('ticket_url') && <p className="mt-1 text-xs text-red-400">{err('ticket_url')}</p>}
      </div>

      <div>
        <label className="label">Imagem (URL)</label>
        <input name="image_url" className="input" placeholder="https://…" />
      </div>

      <div>
        <label className="label">Fonte / página original</label>
        <input name="source_url" className="input" placeholder="https://…" />
      </div>

      <SubmitButton />
    </form>
  );
}
