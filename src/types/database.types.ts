// ════════════════════════════════════════════════════════════════════
// Tipos da base de dados Supabase.
//
// Este ficheiro é um esqueleto manual para o projeto compilar de imediato.
// Depois de criares o projeto Supabase e aplicares as migrations, gera os
// tipos reais (recomendado):
//
//   npx supabase login
//   npx supabase link --project-ref <ref>
//   npm run gen:types
//
// ════════════════════════════════════════════════════════════════════

export type EventStatus = 'pending' | 'approved' | 'rejected' | 'duplicate';
export type EventTypeEnum =
  | 'club' | 'festival' | 'open_air' | 'rave' | 'showcase' | 'boat' | 'other';
export type AppRole = 'user' | 'moderator' | 'admin';
export type AlertFrequency = 'instant' | 'daily' | 'weekly';

export interface EventRow {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  summary: string | null;
  date_start: string;
  date_end: string | null;
  city: string | null;
  country: string;
  venue_id: string | null;
  organizer_id: string | null;
  genre_id: string | null;
  event_type: EventTypeEnum;
  price_min: number | null;
  price_max: number | null;
  currency: string;
  ticket_url: string | null;
  source_url: string | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
  status: EventStatus;
  confidence_score: number | null;
  is_featured: boolean;
  is_festival: boolean;
  duplicate_of: string | null;
  external_id: string | null;
  raw_payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface EventPublicRow extends EventRow {
  venue_name: string | null;
  venue_address: string | null;
  venue_city: string | null;
  genre_name: string | null;
  genre_slug: string | null;
  genre_color: string | null;
  organizer_name: string | null;
}

export interface GenreRow {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  created_at: string;
}

export interface VenueRow {
  id: string;
  name: string;
  slug: string | null;
  address: string | null;
  city: string | null;
  region: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  capacity: number | null;
  website: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: AppRole;
  city: string | null;
  created_at: string;
  updated_at: string;
}

// Tipo Database mínimo compatível com @supabase/supabase-js.
// Substituível pela geração automática.
export type Database = {
  public: {
    Tables: {
      events: { Row: EventRow; Insert: Partial<EventRow>; Update: Partial<EventRow>; Relationships: [] };
      genres: { Row: GenreRow; Insert: Partial<GenreRow>; Update: Partial<GenreRow>; Relationships: [] };
      venues: { Row: VenueRow; Insert: Partial<VenueRow>; Update: Partial<VenueRow>; Relationships: [] };
      organizers: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] };
      event_sources: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] };
      featured_events: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] };
      alerts: { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown>; Relationships: [] };
      profiles: { Row: ProfileRow; Insert: Partial<ProfileRow>; Update: Partial<ProfileRow>; Relationships: [] };
      favorites: {
        Row: { user_id: string; event_id: string; created_at: string };
        Insert: { user_id: string; event_id: string };
        Update: Partial<{ user_id: string; event_id: string }>;
        Relationships: [];
      };
    };
    Views: {
      events_public: { Row: EventPublicRow; Relationships: [] };
    };
    Functions: {
      search_events: { Args: { q: string }; Returns: EventPublicRow[] };
      toggle_favorite: { Args: { p_event_id: string }; Returns: boolean };
      is_admin: { Args: Record<string, never>; Returns: boolean };
    };
    Enums: {
      event_status: EventStatus;
      event_type: EventTypeEnum;
      app_role: AppRole;
      alert_frequency: AlertFrequency;
    };
  };
};
