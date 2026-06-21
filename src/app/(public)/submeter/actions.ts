'use server';

import { createClient } from '@/lib/supabase/server';
import { submitEventSchema } from '@/lib/validation';
import { slugify } from '@/lib/utils';

export interface SubmitResult {
  ok: boolean;
  message: string;
  errors?: Record<string, string>;
}

export async function submitEvent(
  _prev: SubmitResult | null,
  formData: FormData
): Promise<SubmitResult> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = submitEventSchema.safeParse(raw);

  if (!parsed.success) {
    const errors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      errors[issue.path.join('.')] = issue.message;
    }
    return { ok: false, message: 'Verifica os campos assinalados.', errors };
  }

  const d = parsed.data;
  const supabase = createClient();

  // Garante venue (cria se vier nome)
  let venue_id: string | null = null;
  if (d.venue_name) {
    const { data: venue } = await supabase
      .from('venues')
      .insert({ name: d.venue_name, city: d.city, country: 'Portugal' })
      .select('id')
      .single();
    venue_id = venue?.id ?? null;
  }

  const slug = `${slugify(d.title)}-${Date.now().toString(36)}`;

  const { error } = await supabase.from('events').insert({
    title: d.title,
    slug,
    description: d.description || null,
    summary: d.summary || null,
    date_start: new Date(d.date_start).toISOString(),
    date_end: d.date_end ? new Date(d.date_end).toISOString() : null,
    city: d.city,
    venue_id,
    genre_id: d.genre_id || null,
    event_type: d.event_type,
    is_festival: d.event_type === 'festival',
    price_min: d.price_min ?? null,
    price_max: d.price_max ?? null,
    ticket_url: d.ticket_url || null,
    source_url: d.source_url || null,
    image_url: d.image_url || null,
    status: 'pending',      // RLS exige pending nas submissões públicas
    confidence_score: 1,    // submissão humana
  });

  if (error) {
    return { ok: false, message: `Erro ao submeter: ${error.message}` };
  }
  return { ok: true, message: 'Obrigado! O evento foi enviado para revisão.' };
}
