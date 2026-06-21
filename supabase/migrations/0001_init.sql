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
do $$ begin
  create type event_status as enum ('pending', 'approved', 'rejected', 'duplicate');
exception when duplicate_object then null; end $$;

do $$ begin
  create type event_type as enum ('club', 'festival', 'open_air', 'rave', 'showcase', 'boat', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type app_role as enum ('user', 'moderator', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type alert_frequency as enum ('instant', 'daily', 'weekly');
exception when duplicate_object then null; end $$;

-- ─────────────────────────────────────────────
-- Função utilitária: updated_at automático
-- ─────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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

create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Cria profile automaticamente quando nasce um auth.user
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
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
$$;

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
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'moderator')
  );
$$;

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
  on public.events (source_url, external_id);

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

