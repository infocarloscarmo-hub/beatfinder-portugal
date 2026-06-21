// ════════════════════════════════════════════════════════════════════
// Tipos da base de dados Supabase.
//
// Esqueleto manual para o projeto compilar de imediato. Depois de aplicares
// as migrations podes gerar os tipos reais (recomendado):
//
//   npx supabase login
//   npx supabase link --project-ref <ref>
//   npm run gen:types
//
// NOTA: usamos `type` (não `interface`) de propósito. Uma `interface` não
// satisfaz `Record<string, unknown>` (falta-lhe index signature) e isso faz
// o supabase-js degradar as tabelas para `never`, partindo os `.insert()`.
// ════════════════════════════════════════════════════════════════════

export type EventStatus = 'pending' | 'approved' | 'rejected' | 'duplicate';
export type EventTypeEnum =
  | 'club' | 'festival' | 'open_air' | 'rave' | 'showcase' | 'boat' | 'other';
export type AppRole = 'user' | 'moderator' | 'admin';
export type AlertFrequency = 'instant' | 'daily' | 'weekly';

export type EventRow = {
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
};

export type EventPublicRow = EventRow & {
  venue_name: string | null;
  venue_address: string | null;
  venue_city: string | null;
  genre_name: string | null;
  genre_slug: string | null;
  genre_color: string | null;
  organizer_name: string | null;
};

export type GenreRow = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  created_at: string;
};

export type VenueRow = {
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
};

export type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: AppRole;
  city: string | null;
  created_at: string;
  updated_at: string;
};

type AnyRow = Record<string, unknown>;
type GenericTable<R = AnyRow> = {
  Row: R;
  Insert: Partial<R> & AnyRow;
  Update: Partial<R> & AnyRow;
  Relationships: [];
};

// Tipo Database compatível com @supabase/supabase-js.
export type Database = {
  public: {
    Tables: {
      events: GenericTable<EventRow>;
      genres: GenericTable<GenreRow>;
      venues: GenericTable<VenueRow>;
      organizers: GenericTable;
      event_sources: GenericTable;
      featured_events: GenericTable;
      alerts: GenericTable;
      profiles: GenericTable<ProfileRow>;
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
