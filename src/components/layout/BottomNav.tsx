'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarDays, Map, Heart, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/', label: 'Início', icon: Home },
  { href: '/eventos', label: 'Eventos', icon: CalendarDays },
  { href: '/submeter', label: 'Submeter', icon: PlusCircle },
  { href: '/mapa', label: 'Mapa', icon: Map },
  { href: '/favoritos', label: 'Favoritos', icon: Heart },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink-950/90 backdrop-blur-lg md:hidden">
      <div className="mx-auto grid max-w-md grid-cols-5">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition',
                active ? 'text-neon-purple' : 'text-white/50'
              )}
            >
              <Icon size={22} className={active ? 'drop-shadow-[0_0_6px_rgba(139,92,246,0.7)]' : ''} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
