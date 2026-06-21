'use client';

import Link from 'next/link';
import { useTransition } from 'react';
import { Check, X, Copy, Star, Pencil, ExternalLink } from 'lucide-react';
import type { EventRow } from '@/types/database.types';
import { formatEventDate } from '@/lib/dates';
import {
  approveEvent, rejectEvent, markDuplicate, toggleFeatured,
} from '@/app/admin/actions';

export default function AdminEventRow({ event }: { event: EventRow }) {
  const [pending, start] = useTransition();
  const run = (fn: () => Promise<void>) => () => start(() => { fn(); });

  return (
    <div className="card flex flex-col gap-3 p-4 md:flex-row md:items-center">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-semibold text-white">{event.title}</p>
          {event.is_featured && <Star size={14} className="text-neon-pink" fill="currentColor" />}
          {event.confidence_score != null && (
            <span className="chip text-[10px]">conf {Math.round(Number(event.confidence_score) * 100)}%</span>
          )}
        </div>
        <p className="text-sm text-white/50">
          {formatEventDate(event.date_start)} · {event.city ?? '—'}
        </p>
        {event.source_url && (
          <a href={event.source_url} target="_blank" rel="noopener noreferrer"
             className="mt-1 inline-flex items-center gap-1 text-xs text-white/40 hover:text-white">
            <ExternalLink size={12} /> Fonte original
          </a>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {event.status !== 'approved' && (
          <button disabled={pending} onClick={run(() => approveEvent(event.id))}
            className="inline-flex items-center gap-1 rounded-lg bg-neon-lime/15 px-3 py-2 text-xs font-semibold text-neon-lime hover:bg-neon-lime/25">
            <Check size={14} /> Aprovar
          </button>
        )}
        {event.status !== 'rejected' && (
          <button disabled={pending} onClick={run(() => rejectEvent(event.id))}
            className="inline-flex items-center gap-1 rounded-lg bg-red-500/15 px-3 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/25">
            <X size={14} /> Rejeitar
          </button>
        )}
        <button disabled={pending} onClick={run(() => markDuplicate(event.id))}
          className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/10">
          <Copy size={14} /> Duplicado
        </button>
        <button disabled={pending} onClick={run(() => toggleFeatured(event.id, !event.is_featured))}
          className="inline-flex items-center gap-1 rounded-lg bg-neon-pink/15 px-3 py-2 text-xs font-semibold text-neon-pink hover:bg-neon-pink/25">
          <Star size={14} /> {event.is_featured ? 'Remover' : 'Destacar'}
        </button>
        <Link href={`/admin/eventos/${event.id}`}
          className="inline-flex items-center gap-1 rounded-lg bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 hover:bg-white/10">
          <Pencil size={14} /> Editar
        </Link>
      </div>
    </div>
  );
}
