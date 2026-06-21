import { createClient } from '@/lib/supabase/server';
import type { EventPublicRow, GenreRow } from '@/types/database.types';

export interface EventFilters {
  city?: string;
  genre?: string;       // slug
  type?: string;        // event_type
  priceMax?: number;
  from?: string;        // ISO
  to?: string;          // ISO
  festivalsOnly?: boolean;
  limit?: number;
}

/** Lista eventos aprovados com filtros opcionais (ordenados por data). */
export async function getEvents(filters: EventFilters = {}): Promise<EventPublicRow[]> {
  const supabase = createClient();
  let query = supabase
    .from('events_public')
    .select('*')
    .order('date_start', { ascending: true });

  if (filters.city) query = query.eq('city', filters.city);
  if (filters.genre) query = query.eq('genre_slug', filters.genre);
  if (filters.type) query = query.eq('event_type', filters.type);
  if (filters.priceMax != null) query = query.lte('price_min', filters.priceMax);
  if (filters.from) query = query.gte('date_start', filters.from);
  if (filters.to) query = query.lte('date_start', filters.to);
  if (filters.festivalsOnly) query = query.eq('is_festival', true);
  if (filters.limit) query = query.limit(filters.limit);
  else query = query.gte('date_start', new Date().toISOString());

  const { data, error } = await query;
  if (error) {
    console.error('getEvents error:', error.message);
    return [];
  }
  return data ?? [];
}

export async function getFeaturedEvents(): Promise<EventPublicRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from('events_public')
    .select('*')
    .eq('is_featured', true)
    .gte('date_start', new Date().toISOString())
    .order('date_start', { ascending: true })
    .limit(8);
  return data ?? [];
}

export async function getEventBySlug(slug: string): Promise<EventPublicRow | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from('events_public')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  return data ?? null;
}

export async function getGenres(): Promise<GenreRow[]> {
  const supabase = createClient();
  const { data } = await supabase.from('genres').select('*').order('name');
  return data ?? [];
}

export async function searchEvents(q: string): Promise<EventPublicRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('search_events', { q });
  if (error) {
    console.error('searchEvents error:', error.message);
    return [];
  }
  return (data as EventPublicRow[]) ?? [];
}
