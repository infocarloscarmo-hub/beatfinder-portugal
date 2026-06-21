import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Star } from 'lucide-react';
import type { EventPublicRow } from '@/types/database.types';
import { formatEventDate } from '@/lib/dates';
import { formatPrice } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import FavoriteButton from './FavoriteButton';

export default function EventCard({ event }: { event: EventPublicRow }) {
  return (
    <Link
      href={`/eventos/${event.slug}`}
      className="group card relative overflow-hidden transition hover:-translate-y-0.5 hover:border-neon-purple/30 hover:shadow-neon"
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-ink-700">
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            sizes="(max-width:768px) 100vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-ink-700 to-ink-900 text-3xl">
            🎵
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink-900/90 via-transparent" />
        {event.is_featured && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-neon-pink/90 px-2 py-1 text-[10px] font-bold uppercase text-white">
            <Star size={11} fill="currentColor" /> Destaque
          </span>
        )}
        <FavoriteButton eventId={event.id} className="absolute right-3 top-3" />
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-xs font-semibold text-neon-cyan">
            {formatEventDate(event.date_start)}
          </p>
        </div>
      </div>

      <div className="space-y-2 p-4">
        <h3 className="line-clamp-2 font-display text-base font-bold leading-tight text-white">
          {event.title}
        </h3>
        <div className="flex items-center gap-1.5 text-sm text-white/55">
          <MapPin size={14} />
          <span className="line-clamp-1">
            {[event.venue_name, event.city].filter(Boolean).join(' · ') || 'Local a confirmar'}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {event.genre_name && (
            <Badge color={event.genre_color}>{event.genre_name}</Badge>
          )}
          <span className="ml-auto text-sm font-semibold text-white">
            {formatPrice(event.price_min, event.price_max, event.currency)}
          </span>
        </div>
      </div>
    </Link>
  );
}
