-- ════════════════════════════════════════════════════════════════════════════
-- Beatfinder Portugal — Row Level Security
-- Migration 0002_rls
-- ════════════════════════════════════════════════════════════════════════════

alter table public.profiles          enable row level security;
alter table public.genres            enable row level security;
alter table public.venues            enable row level security;
alter table public.organizers        enable row level security;
alter table public.events            enable row level security;
alter table public.event_sources     enable row level security;
alter table public.event_source_links enable row level security;
alter table public.featured_events   enable row level security;
alter table public.favorites         enable row level security;
alter table public.alerts            enable row level security;

-- ── PROFILES ────────────────────────────────────────────────
create policy "profiles_select_self_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ── GENRES (leitura pública, escrita admin) ─────────────────
create policy "genres_read_all" on public.genres
  for select using (true);
create policy "genres_admin_write" on public.genres
  for all using (public.is_admin()) with check (public.is_admin());

-- ── VENUES ──────────────────────────────────────────────────
create policy "venues_read_all" on public.venues
  for select using (true);
create policy "venues_admin_write" on public.venues
  for all using (public.is_admin()) with check (public.is_admin());

-- ── ORGANIZERS ──────────────────────────────────────────────
create policy "organizers_read_all" on public.organizers
  for select using (true);
create policy "organizers_admin_write" on public.organizers
  for all using (public.is_admin()) with check (public.is_admin());

-- ── EVENTS ──────────────────────────────────────────────────
-- Público vê apenas aprovados; admin vê tudo.
create policy "events_read_approved" on public.events
  for select using (status = 'approved' or public.is_admin());

-- Qualquer pessoa (mesmo anónima) pode submeter — entra como 'pending'.
-- A app deve forçar status='pending' no insert público.
create policy "events_insert_public_pending" on public.events
  for insert with check (status = 'pending');

-- Só admin/moderator atualiza ou apaga.
create policy "events_admin_update" on public.events
  for update using (public.is_admin()) with check (public.is_admin());
create policy "events_admin_delete" on public.events
  for delete using (public.is_admin());

-- ── EVENT_SOURCES (só admin) ────────────────────────────────
create policy "sources_admin_all" on public.event_sources
  for all using (public.is_admin()) with check (public.is_admin());
create policy "source_links_admin_all" on public.event_source_links
  for all using (public.is_admin()) with check (public.is_admin());

-- ── FEATURED_EVENTS (leitura pública, escrita admin) ────────
create policy "featured_read_all" on public.featured_events
  for select using (true);
create policy "featured_admin_write" on public.featured_events
  for all using (public.is_admin()) with check (public.is_admin());

-- ── FAVORITES (cada um gere os seus) ────────────────────────
create policy "favorites_owner_all" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── ALERTS (cada um gere os seus) ───────────────────────────
create policy "alerts_owner_all" on public.alerts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Nota: a view events_public roda com privilégios do criador e já filtra
-- por status='approved', servindo leitura anónima sem expor pendentes.
