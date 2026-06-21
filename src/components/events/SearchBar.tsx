'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';

export default function SearchBar({ initial = '' }: { initial?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(`/pesquisa?q=${encodeURIComponent(q)}`);
      }}
      className="relative"
    >
      <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Procurar artistas, clubes, festivais…"
        className="input pl-11"
      />
    </form>
  );
}
