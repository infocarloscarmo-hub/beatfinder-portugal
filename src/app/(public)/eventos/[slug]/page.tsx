import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, CalendarClock, Ticket, ExternalLink, Tag } from 'lucide-react';
import type { Metadata } from 'next';
import { getEventBySlug } from '@/lib/queries';
import { formatEventDateLong } from '@/lib/dates';
import { formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import FavoriteButton from '@/components/events/FavoriteButton';

export const revalidate = 120;

export async function generateMetadata({
  params,
}: { params: { slug: string } }): Promise<Metadata> {
  const event = await getEventBySlug(params.slug);
  if (!event) return { title: 'Evento não encontrado' };
  return {
    title: event.title,
    description: event.summary ?? event.description ?? undefined,
    openGraph: { images: event.image_url ? [event.image_url] : undefined },
  };
}

export default async function EventDetailPage({
  params,
}: { params: { slug: string } }) {
  const event = await getEventBySlug(params.slug);
  if (!event) notFound();

  return (
    <article className="space-y-8">
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl border border-white/10 bg-ink-700">
        {event.image_url ? (
          <Image src={event.image_url} alt={event.title} fill priority className="object-cover" sizes="100vw" />
        ) : (
          <div className="flex h-full items-center justify-center text-6xl">🎵</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/30" />
        <FavoriteButton eventId={event.id} className="absolute right-4 top-4" />
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              {event.genre_name && <Badge color={event.genre_color}><Tag size={12} /> {event.genre_name}</Badge>}
              {event.is_festival && <Badge>Festival</Badge>}
              {event.is_featured && <Badge className="border-neon-pink/40 text-neon-pink">Destaque</Badge>}
            </div>
            <h1 className="font-display text-3xl font-black text-white md:text-4xl">{event.title}</h1>
            {event.summary && <p className="mt-2 text-lg text-white/60">{event.summary}</p>}
          </div>

          {event.description && (
            <div className="prose prose-invert max-w-none whitespace-pre-line text-white/75">
              {event.description}
            </div>
          )}

          {event.organizer_name && (
            <p className="text-sm text-white/50">Organização: <span className="text-white/80">{event.organizer_name}</span></p>
          )}

          {event.source_url && (
            <a href={event.source_url} target="_blank" rel="noopener noreferrer"
               className="inline-flex items-center gap-1 text-sm text-white/40 hover:text-white">
              <ExternalLink size={14} /> Fonte original
            </a>
          )}
        </div>

        {/* Sidebar info */}
        <aside className="space-y-4">
          <div className="card space-y-4 p-5">
            <div className="flex items-start gap-3">
              <CalendarClock className="mt-0.5 text-neon-cyan" size={20} />
              <div>
                <p className="text-xs uppercase tracking-wide text-white/40">Quando</p>
                <p className="text-sm font-medium text-white">{formatEventDateLong(event.date_start)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 text-neon-purple" size={20} />
              <div>
                <p className="text-xs uppercase tracking-wide text-white/40">Onde</p>
                <p className="text-sm font-medium text-white">{event.venue_name ?? 'Local a confirmar'}</p>
                <p className="text-sm text-white/50">{[event.venue_address, event.city].filter(Boolean).join(', ')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Ticket className="mt-0.5 text-neon-lime" size={20} />
              <div>
                <p className="text-xs uppercase tracking-wide text-white/40">Preço</p>
                <p className="text-sm font-medium text-white">{formatPrice(event.price_min, event.price_max, event.currency)}</p>
              </div>
            </div>
            {event.ticket_url && (
              <a href={event.ticket_url} target="_blank" rel="noopener noreferrer" className="btn-primary w-full">
                <Ticket size={16} /> Comprar bilhete
              </a>
            )}
          </div>

          {event.latitude != null && event.longitude != null && (
            <Link href="/mapa" className="card block p-4 text-center text-sm text-neon-purple hover:bg-white/5">
              Ver no mapa →
            </Link>
          )}
        </aside>
      </div>
    </article>
  );
}
