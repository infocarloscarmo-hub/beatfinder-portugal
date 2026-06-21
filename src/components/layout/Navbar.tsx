'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Heart } from 'lucide-react';
import Logo from './Logo';
import { NAV_LINKS } from '@/lib/constants';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-ink-950/80 backdrop-blur-lg">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />
        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                'rounded-lg px-3 py-2 text-sm font-medium transition',
                pathname === l.href
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white'
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1">
          <Link href="/pesquisa" className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Pesquisar">
            <Search size={20} />
          </Link>
          <Link href="/favoritos" className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white" aria-label="Favoritos">
            <Heart size={20} />
          </Link>
          <Link href="/submeter" className="ml-1 hidden rounded-xl bg-neon-purple px-3 py-2 text-sm font-semibold text-white hover:brightness-110 sm:inline-flex">
            Submeter
          </Link>
        </div>
      </div>
    </header>
  );
}
