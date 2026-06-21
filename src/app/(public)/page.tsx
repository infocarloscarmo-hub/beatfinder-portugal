import Link from 'next/link';
import { CalendarDays, MapPin, Sparkles, ArrowRight } from 'lucide-react';
import { getEvents, getFeaturedEvents } from '@/lib/queries';
import { todayRange, weekendRange } from '@/lib/dates';
import EventGrid from '@/components/events/EventGrid';
import SearchBar from '@/components/events/SearchBar';
import { SectionHeader } from '@/components/ui/SectionHeader';

export const dynamic = 'force-dynamic'; // render a pedido (não consulta o Supabase no build)

export default async function HomePage() {
  const today = todayRange();
  const weekend = weekendRange();

  const [featured, todayEvents, weekendEvents, upcoming] = await Promise.all([
    getFeaturedEvents(),
    getEvents({ from: today.start, to: today.end, limit: 6 }),
    getEvents({ from: weekend.start, to: weekend.end, limit: 6 }),
    getEvents({ limit: 9 }),
  ]);

  return (
    <div className="space-y-12">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-white/5 bg-gradient-to-br from-ink-800 via-ink-900 to-ink-950 px-6 py-12 md:px-12 md:py-16">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-neon-purple/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-10 h-64 w-64 rounded-full bg-neon-pink/15 blur-3xl" />
        <div className="relative max-w-2xl">
          <span className="chip mb-4"><Sparkles size={13} /> Radar automático de eventos</span>
          <h1 className="font-display text-4xl font-black leading-tight text-white md:text-6xl">
            Encontra a tua próxima <span className="text-neon-purple neon-text">festa</span> em Portugal.
          </h1>
          <p className="mt-4 max-w-lg text-white/60">
            Festas, festivais e eventos de música eletrónica — descobertos
            automaticamente e organizados num só sítio.
          </p>
          <div className="mt-6 max-w-md"><SearchBar /></div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/hoje" className="btn-ghost"><CalendarDays size={16} /> Hoje</Link>
            <Link href="/fim-de-semana" className="btn-ghost">Fim de semana</Link>
            <Link href="/mapa" className="btn-ghost"><MapPin size={16} /> Mapa</Link>
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section>
          <SectionHeader title="Em destaque" hint="Eventos recomendados" />
          <EventGrid events={featured} />
        </section>
      )}

      <section>
        <SectionHeader title="Hoje" href="/hoje" hint="O que se passa esta noite" />
        <EventGrid events={todayEvents} empty={{ title: 'Nada para hoje ainda', subtitle: 'Vê o que aí vem este fim de semana.' }} />
      </section>

      <section>
        <SectionHeader title="Este fim de semana" href="/fim-de-semana" />
        <EventGrid events={weekendEvents} />
      </section>

      <section>
        <SectionHeader title="A não perder" href="/eventos" hint="Próximos eventos" />
        <EventGrid events={upcoming} />
        <div className="mt-6 text-center">
          <Link href="/eventos" className="btn-primary">Ver todos os eventos <ArrowRight size={16} /></Link>
        </div>
      </section>
    </div>
  );
}
