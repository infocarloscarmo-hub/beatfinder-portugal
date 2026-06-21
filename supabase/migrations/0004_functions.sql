-- ════════════════════════════════════════════════════════════════════════════
-- Beatfinder Portugal — Funções RPC
-- Migration 0004_functions
-- ════════════════════════════════════════════════════════════════════════════

-- Pesquisa full-text de eventos aprovados (tolerante a acentos)
create or replace function public.search_events(q text)
returns setof public.events_public
language sql
stable
as $$
  select *
  from public.events_public
  where q is null
     or q = ''
     or to_tsvector('simple',
          public.f_unaccent(coalesce(title,'') || ' ' || coalesce(summary,'') || ' ' || coalesce(city,'')))
        @@ plainto_tsquery('simple', public.f_unaccent(q))
  order by date_start asc;
$$;

-- Alterna favorito do utilizador autenticado; devolve o novo estado
create or replace function public.toggle_favorite(p_event_id uuid)
returns boolean
language plpgsql
security definer set search_path = public
as $$
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
$$;
