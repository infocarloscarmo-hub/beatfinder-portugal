import { createClient } from '@/lib/supabase/server';
import AdminEventRow from '@/components/admin/AdminEventRow';
import type { EventRow, EventStatus } from '@/types/database.types';

export const dynamic = 'force-dynamic';

const TABS: { key: EventStatus; label: string }[] = [
  { key: 'pending', label: 'Pendentes' },
  { key: 'approved', label: 'Aprovados' },
  { key: 'rejected', label: 'Rejeitados' },
  { key: 'duplicate', label: 'Duplicados' },
];

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: { tab?: EventStatus };
}) {
  const supabase = createClient();
  const active = (searchParams.tab ?? 'pending') as EventStatus;

  // Contagens por estado
  const counts: Record<string, number> = {};
  await Promise.all(
    TABS.map(async (t) => {
      const { count } = await supabase
        .from('events')
        .select('id', { count: 'exact', head: true })
        .eq('status', t.key);
      counts[t.key] = count ?? 0;
    })
  );

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('status', active)
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Gestão de eventos</h1>
        <p className="text-sm text-white/50">Aprova, edita e organiza os eventos detetados.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {TABS.map((t) => (
          <a
            key={t.key}
            href={`/admin?tab=${t.key}`}
            className={`card p-4 transition hover:border-neon-purple/30 ${active === t.key ? 'border-neon-purple/50' : ''}`}
          >
            <p className="text-2xl font-bold text-white">{counts[t.key] ?? 0}</p>
            <p className="text-sm text-white/50">{t.label}</p>
          </a>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {(events ?? []).length === 0 && (
          <div className="card p-10 text-center text-white/40">Sem eventos neste estado.</div>
        )}
        {(events as EventRow[] | null)?.map((ev) => (
          <AdminEventRow key={ev.id} event={ev} />
        ))}
      </div>
    </div>
  );
}
