'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { CITIES, EVENT_TYPES } from '@/lib/constants';
import type { GenreRow } from '@/types/database.types';

export default function EventFilters({ genres }: { genres: GenreRow[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.replace(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router]
  );

  return (
    <div className="card mb-6 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/80">
        <SlidersHorizontal size={16} /> Filtros
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div>
          <label className="label">Cidade</label>
          <select className="input" value={params.get('city') ?? ''} onChange={(e) => setParam('city', e.target.value)}>
            <option value="">Todas</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Género</label>
          <select className="input" value={params.get('genre') ?? ''} onChange={(e) => setParam('genre', e.target.value)}>
            <option value="">Todos</option>
            {genres.map((g) => <option key={g.id} value={g.slug}>{g.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Tipo</label>
          <select className="input" value={params.get('type') ?? ''} onChange={(e) => setParam('type', e.target.value)}>
            <option value="">Todos</option>
            {EVENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Preço máx. (€)</label>
          <input
            type="number" min={0} placeholder="Qualquer"
            className="input"
            defaultValue={params.get('priceMax') ?? ''}
            onBlur={(e) => setParam('priceMax', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
