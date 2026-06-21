'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { EventStatus } from '@/types/database.types';

async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/admin/login');
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'moderator'].includes(profile.role)) {
    throw new Error('forbidden');
  }
  return supabase;
}

function refresh() {
  revalidatePath('/admin');
  for (const p of ['/', '/eventos', '/hoje', '/fim-de-semana', '/festivais', '/mapa']) {
    revalidatePath(p);
  }
}

export async function setEventStatus(id: string, status: EventStatus) {
  const supabase = await requireAdmin();
  await supabase.from('events').update({ status }).eq('id', id);
  refresh();
}

export async function approveEvent(id: string) { return setEventStatus(id, 'approved'); }
export async function rejectEvent(id: string)  { return setEventStatus(id, 'rejected'); }

export async function markDuplicate(id: string, duplicateOf?: string) {
  const supabase = await requireAdmin();
  await supabase.from('events')
    .update({ status: 'duplicate', duplicate_of: duplicateOf ?? null })
    .eq('id', id);
  refresh();
}

export async function toggleFeatured(id: string, value: boolean) {
  const supabase = await requireAdmin();
  await supabase.from('events').update({ is_featured: value }).eq('id', id);
  refresh();
}

export async function updateEvent(id: string, formData: FormData) {
  const supabase = await requireAdmin();
  const get = (k: string) => {
    const v = formData.get(k);
    return v === null || v === '' ? null : String(v);
  };
  const num = (k: string) => {
    const v = get(k);
    return v == null ? null : Number(v);
  };
  await supabase.from('events').update({
    title: get('title') ?? undefined,
    summary: get('summary'),
    description: get('description'),
    city: get('city'),
    date_start: get('date_start') ? new Date(get('date_start')!).toISOString() : undefined,
    date_end: get('date_end') ? new Date(get('date_end')!).toISOString() : null,
    price_min: num('price_min'),
    price_max: num('price_max'),
    ticket_url: get('ticket_url'),
    image_url: get('image_url'),
    genre_id: get('genre_id'),
    is_featured: formData.get('is_featured') === 'on',
    is_festival: formData.get('is_festival') === 'on',
  }).eq('id', id);
  refresh();
  redirect('/admin');
}

export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
