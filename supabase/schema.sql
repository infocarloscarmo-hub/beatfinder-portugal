-- ════════════════════════════════════════════════════════════════════════════
-- Beatfinder Portugal — Schema inicial
-- Migration 0001_init
-- ════════════════════════════════════════════════════════════════════════════

-- Extensões úteis
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "unaccent";   -- pesquisa sem acentos
-- (PostGIS é opcional. Usamos lat/long simples para portabilidade.)

-- Wrapper IMMUTABLE de unaccent (necessário para usar em índices).
-- Fixa o search_path para encontrar a extensão (que no Supabase vive no
-- schema "extensions") e usa a forma de 1 argumento, sempre disponível.
create or replace function public.f_unaccent(input text)
returns text
language sql
immutable
set search_path = extensions, public, pg_catalog
as $fn$
  select unaccent(input)
$fn$;

-- ─────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────
do $do$ begin
  create type event_status as enum ('pending', 'approved', 'rejected', 'duplicate');
exception when duplicate_object then null; end $do$;

do $do$ begin
  create type event_type as enum ('club', 'festival', 'open_air', 'rave', 'showcase', 'boat', 'other');
exception when duplicate_object then null; end $do$;

do $do$ begin
  create type app_role as enum ('user', 'moderator', 'admin');
exception when duplicate_object then null; end $do$;

do $do$ begin
  create type alert_frequency as enum ('instant', 'daily', 'weekly');
exception when duplicate_object then null; end $do$;

-- ─────────────────────────────────────────────
-- Função utilitária: updated_at automático
-- ─────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $fn$
begin
  new.updated_at = now();
  return new;
end;
$fn$;

-- ════════════════════════════════════════════════════════════════════════════
-- PROFILES (1:1 com auth.users)
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  avatar_url  text,
  role        app_role not null default 'user',
  city        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Cria profile automaticamente quando nasce um auth.user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $fn$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$fn$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Helper: é admin/moderator?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $fn$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'moderator')
  );
$fn$;

-- ════════════════════════════════════════════════════════════════════════════
-- GENRES
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists public.genres (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  color       text,            -- cor neon p/ chips (hex)
  created_at  timestamptz not null default now()
);

-- ════════════════════════════════════════════════════════════════════════════
-- VENUES
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists public.venues (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique,
  address     text,
  city        text,
  region      text,
  country     text not null default 'Portugal',
  latitude    double precision,
  longitude   double precision,
  capacity    integer,
  website     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_venues_updated on public.venues;
create trigger trg_venues_updated
  before update on public.venues
  for each row execute function public.set_updated_at();

create index if not exists idx_venues_city on public.venues (city);

-- ════════════════════════════════════════════════════════════════════════════
-- ORGANIZERS
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists public.organizers (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text unique,
  description text,
  website     text,
  instagram   text,
  email       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_organizers_updated on public.organizers;
create trigger trg_organizers_updated
  before update on public.organizers
  for each row execute function public.set_updated_at();

-- ════════════════════════════════════════════════════════════════════════════
-- EVENTS
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists public.events (
  id                uuid primary key default gen_random_uuid(),
  title             text not null,
  slug              text not null unique,
  description       text,
  summary           text,
  date_start        timestamptz not null,
  date_end          timestamptz,
  city              text,
  country           text not null default 'Portugal',
  venue_id          uuid references public.venues(id) on delete set null,
  organizer_id      uuid references public.organizers(id) on delete set null,
  genre_id          uuid references public.genres(id) on delete set null,
  event_type        event_type not null default 'club',
  price_min         numeric(10,2),
  price_max         numeric(10,2),
  currency          text not null default 'EUR',
  ticket_url        text,
  source_url        text,
  image_url         text,
  latitude          double precision,
  longitude         double precision,
  status            event_status not null default 'pending',
  confidence_score  numeric(4,3) default 0.000,   -- 0..1 (confiança do scraper/n8n)
  is_featured       boolean not null default false,
  is_festival       boolean not null default false,
  duplicate_of      uuid references public.events(id) on delete set null,
  external_id       text,            -- id na fonte (dedupe pelo n8n)
  raw_payload       jsonb,           -- payload original do scraping
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

drop trigger if exists trg_events_updated on public.events;
create trigger trg_events_updated
  before update on public.events
  for each row execute function public.set_updated_at();

-- Índices de performance e pesquisa
create index if not exists idx_events_status      on public.events (status);
create index if not exists idx_events_date_start  on public.events (date_start);
create index if not exists idx_events_city        on public.events (city);
create index if not exists idx_events_genre       on public.events (genre_id);
create index if not exists idx_events_featured    on public.events (is_featured) where is_featured = true;
create index if not exists idx_events_festival    on public.events (is_festival) where is_festival = true;
create unique index if not exists idx_events_source_external
  on public.events (source_url, external_id) where external_id is not null;

-- Pesquisa full-text (título + summary + cidade), tolerante a acentos
create index if not exists idx_events_search on public.events
  using gin (to_tsvector('simple',
    public.f_unaccent(coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(city,''))));

-- ════════════════════════════════════════════════════════════════════════════
-- EVENT_SOURCES (fontes de scraping / origem n8n)
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists public.event_sources (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,           -- ex: "RA Lisboa", "Instagram @club"
  type          text,                    -- ra | instagram | fb | site | manual
  base_url      text,
  is_active     boolean not null default true,
  last_run_at   timestamptz,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists trg_event_sources_updated on public.event_sources;
create trigger trg_event_sources_updated
  before update on public.event_sources
  for each row execute function public.set_updated_at();

-- Liga um evento à fonte que o produziu (1 evento pode ter várias deteções)
create table if not exists public.event_source_links (
  id           uuid primary key default gen_random_uuid(),
  event_id     uuid not null references public.events(id) on delete cascade,
  source_id    uuid references public.event_sources(id) on delete set null,
  source_url   text,
  fetched_at   timestamptz not null default now()
);
create index if not exists idx_esl_event on public.event_source_links (event_id);

-- ════════════════════════════════════════════════════════════════════════════
-- FEATURED_EVENTS (destaques pagos / curados, com janela temporal)
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists public.featured_events (
  id            uuid primary key default gen_random_uuid(),
  event_id      uuid not null references public.events(id) on delete cascade,
  position      integer not null default 0,    -- ordenação no carrossel
  is_paid       boolean not null default false,
  starts_at     timestamptz not null default now(),
  ends_at       timestamptz,
  created_by    uuid references public.profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists idx_featured_event on public.featured_events (event_id);
create index if not exists idx_featured_window on public.featured_events (starts_at, ends_at);

-- ════════════════════════════════════════════════════════════════════════════
-- FAVORITES
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists public.favorites (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  event_id    uuid not null references public.events(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, event_id)
);
create index if not exists idx_favorites_user on public.favorites (user_id);

-- ════════════════════════════════════════════════════════════════════════════
-- ALERTS (subscrições por critérios)
-- ════════════════════════════════════════════════════════════════════════════
create table if not exists public.alerts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  name          text,
  city          text,
  genre_id      uuid references public.genres(id) on delete set null,
  price_max     numeric(10,2),
  event_type    event_type,
  frequency     alert_frequency not null default 'weekly',
  is_active     boolean not null default true,
  last_sent_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists trg_alerts_updated on public.alerts;
create trigger trg_alerts_updated
  before update on public.alerts
  for each row execute function public.set_updated_at();

create index if not exists idx_alerts_user on public.alerts (user_id);

-- ════════════════════════════════════════════════════════════════════════════
-- VIEW: eventos públicos (apenas aprovados, com joins prontos)
-- ════════════════════════════════════════════════════════════════════════════
create or replace view public.events_public as
  select
    e.*,
    v.name      as venue_name,
    v.address   as venue_address,
    v.city      as venue_city,
    g.name      as genre_name,
    g.slug      as genre_slug,
    g.color     as genre_color,
    o.name      as organizer_name
  from public.events e
  left join public.venues v     on v.id = e.venue_id
  left join public.genres g     on g.id = e.genre_id
  left join public.organizers o on o.id = e.organizer_id
  where e.status = 'approved';

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
drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin" on public.profiles
  for select using (auth.uid() = id or public.is_admin());
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update using (auth.uid() = id);
drop policy if exists "profiles_admin_all" on public.profiles;
create policy "profiles_admin_all" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- ── GENRES (leitura pública, escrita admin) ─────────────────
drop policy if exists "genres_read_all" on public.genres;
create policy "genres_read_all" on public.genres
  for select using (true);
drop policy if exists "genres_admin_write" on public.genres;
create policy "genres_admin_write" on public.genres
  for all using (public.is_admin()) with check (public.is_admin());

-- ── VENUES ──────────────────────────────────────────────────
drop policy if exists "venues_read_all" on public.venues;
create policy "venues_read_all" on public.venues
  for select using (true);
drop policy if exists "venues_admin_write" on public.venues;
create policy "venues_admin_write" on public.venues
  for all using (public.is_admin()) with check (public.is_admin());

-- ── ORGANIZERS ──────────────────────────────────────────────
drop policy if exists "organizers_read_all" on public.organizers;
create policy "organizers_read_all" on public.organizers
  for select using (true);
drop policy if exists "organizers_admin_write" on public.organizers;
create policy "organizers_admin_write" on public.organizers
  for all using (public.is_admin()) with check (public.is_admin());

-- ── EVENTS ──────────────────────────────────────────────────
-- Público vê apenas aprovados; admin vê tudo.
drop policy if exists "events_read_approved" on public.events;
create policy "events_read_approved" on public.events
  for select using (status = 'approved' or public.is_admin());

-- Qualquer pessoa (mesmo anónima) pode submeter — entra como 'pending'.
-- A app deve forçar status='pending' no insert público.
drop policy if exists "events_insert_public_pending" on public.events;
create policy "events_insert_public_pending" on public.events
  for insert with check (status = 'pending');

-- Só admin/moderator atualiza ou apaga.
drop policy if exists "events_admin_update" on public.events;
create policy "events_admin_update" on public.events
  for update using (public.is_admin()) with check (public.is_admin());
drop policy if exists "events_admin_delete" on public.events;
create policy "events_admin_delete" on public.events
  for delete using (public.is_admin());

-- ── EVENT_SOURCES (só admin) ────────────────────────────────
drop policy if exists "sources_admin_all" on public.event_sources;
create policy "sources_admin_all" on public.event_sources
  for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists "source_links_admin_all" on public.event_source_links;
create policy "source_links_admin_all" on public.event_source_links
  for all using (public.is_admin()) with check (public.is_admin());

-- ── FEATURED_EVENTS (leitura pública, escrita admin) ────────
drop policy if exists "featured_read_all" on public.featured_events;
create policy "featured_read_all" on public.featured_events
  for select using (true);
drop policy if exists "featured_admin_write" on public.featured_events;
create policy "featured_admin_write" on public.featured_events
  for all using (public.is_admin()) with check (public.is_admin());

-- ── FAVORITES (cada um gere os seus) ────────────────────────
drop policy if exists "favorites_owner_all" on public.favorites;
create policy "favorites_owner_all" on public.favorites
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ── ALERTS (cada um gere os seus) ───────────────────────────
drop policy if exists "alerts_owner_all" on public.alerts;
create policy "alerts_owner_all" on public.alerts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Nota: a view events_public roda com privilégios do criador e já filtra
-- por status='approved', servindo leitura anónima sem expor pendentes.

-- ════════════════════════════════════════════════════════════════════════════
-- Beatfinder Portugal — Dados iniciais (géneros, fontes)
-- Migration 0003_seed
-- ════════════════════════════════════════════════════════════════════════════

insert into public.genres (name, slug, color) values
  ('Techno',        'techno',        '#22d3ee'),
  ('House',         'house',         '#a3e635'),
  ('Tech House',    'tech-house',    '#34d399'),
  ('Melodic Techno','melodic-techno','#8b5cf6'),
  ('Trance',        'trance',        '#f472b6'),
  ('Drum & Bass',   'drum-and-bass', '#fb7185'),
  ('Hardtechno',    'hardtechno',    '#ef4444'),
  ('Minimal',       'minimal',       '#60a5fa'),
  ('Afro House',    'afro-house',    '#f59e0b'),
  ('Disco / Nu-Disco','disco',       '#ff2e88')
on conflict (slug) do nothing;

insert into public.event_sources (name, type, base_url, is_active) values
  ('Resident Advisor — Portugal', 'ra',        'https://ra.co/events/pt', true),
  ('Instagram (clubes/promotores)','instagram', 'https://instagram.com',  true),
  ('Submissões do site',           'manual',    null,                     true)
on conflict do nothing;

-- ════════════════════════════════════════════════════════════════════════════
-- Beatfinder Portugal — Funções RPC
-- Migration 0004_functions
-- ════════════════════════════════════════════════════════════════════════════

-- Pesquisa full-text de eventos aprovados (tolerante a acentos)
create or replace function public.search_events(q text)
returns setof public.events_public
language sql
stable
as $fn$
  select *
  from public.events_public
  where q is null
     or q = ''
     or to_tsvector('simple',
          public.f_unaccent(coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(city,'')))
        @@ plainto_tsquery('simple', public.f_unaccent(q))
  order by date_start asc;
$fn$;

-- Alterna favorito do utilizador autenticado; devolve o novo estado
create or replace function public.toggle_favorite(p_event_id uuid)
returns boolean
language plpgsql
security definer set search_path = public
as $fn$
declare
  v_exists boolean;
begin
  if auth.uid() is null then
    raise exception 'auth required';
  end if;

  select exists(
    select 1 from public.favorites
    where user_id = auth.uid() and event_id = p_event_id
  ) into v_exists;

  if v_exists then
    delete from public.favorites
      where user_id = auth.uid() and event_id = p_event_id;
    return false;
  else
    insert into public.favorites (user_id, event_id)
      values (auth.uid(), p_event_id)
      on conflict do nothing;
    return true;
  end if;
end;
$fn$;
