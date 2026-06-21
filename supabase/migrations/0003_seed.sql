-- ════════════════════════════════════════════════════════════════════════════
-- Beatfinder Portugal — Dados iniciais (géneros, fontes, cidades exemplo)
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
