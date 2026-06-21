'use client';

import { Heart } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';

export default function FavoriteButton({
  eventId,
  className,
}: {
  eventId: string;
  className?: string;
}) {
  const { isFavorite, toggle } = useFavorites();
  const active = isFavorite(eventId);
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(eventId);
      }}
      aria-label={active ? 'Remover dos favoritos' : 'Guardar nos favoritos'}
      className={cn(
        'rounded-full border border-white/10 bg-ink-900/70 p-2 backdrop-blur transition hover:bg-white/10',
        active && 'border-neon-pink/40 text-neon-pink',
        className
      )}
    >
      <Heart size={18} fill={active ? 'currentColor' : 'none'} />
    </button>
  );
}
