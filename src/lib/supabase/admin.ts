import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

/**
 * Cliente com service_role — BYPASS RLS.
 * Usar APENAS em código de servidor de confiança (ex: /api/ingest do n8n).
 * Nunca importar em Client Components.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
