import { z } from 'zod';

/** Schema de submissão pública de evento. */
export const submitEventSchema = z.object({
  title: z.string().min(3, 'Título demasiado curto').max(160),
  description: z.string().max(5000).optional().or(z.literal('')),
  summary: z.string().max(300).optional().or(z.literal('')),
  date_start: z.string().min(1, 'Data obrigatória'),
  date_end: z.string().optional().or(z.literal('')),
  city: z.string().min(1, 'Cidade obrigatória'),
  venue_name: z.string().optional().or(z.literal('')),
  genre_id: z.string().uuid().optional().or(z.literal('')),
  event_type: z
    .enum(['club', 'festival', 'open_air', 'rave', 'showcase', 'boat', 'other'])
    .default('club'),
  price_min: z.coerce.number().min(0).optional(),
  price_max: z.coerce.number().min(0).optional(),
  ticket_url: z.string().url('URL inválido').optional().or(z.literal('')),
  source_url: z.string().url('URL inválido').optional().or(z.literal('')),
  image_url: z.string().url('URL inválido').optional().or(z.literal('')),
});

export type SubmitEventInput = z.infer<typeof submitEventSchema>;

/** Schema do payload de ingestão automática (n8n → /api/ingest). */
export const ingestEventSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  summary: z.string().optional(),
  date_start: z.string(),
  date_end: z.string().optional().nullable(),
  city: z.string().optional(),
  country: z.string().default('Portugal'),
  venue_name: z.string().optional(),
  venue_address: z.string().optional(),
  organizer_name: z.string().optional(),
  genre: z.string().optional(),          // slug ou nome
  event_type: z
    .enum(['club', 'festival', 'open_air', 'rave', 'showcase', 'boat', 'other'])
    .optional(),
  is_festival: z.boolean().optional(),
  price_min: z.number().optional().nullable(),
  price_max: z.number().optional().nullable(),
  ticket_url: z.string().optional().nullable(),
  source_url: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  external_id: z.string().optional().nullable(),
  confidence_score: z.number().min(0).max(1).optional(),
  source_name: z.string().optional(),
  raw_payload: z.record(z.unknown()).optional(),
});

export const ingestBatchSchema = z.object({
  events: z.array(ingestEventSchema).min(1).max(200),
});

export type IngestEventInput = z.infer<typeof ingestEventSchema>;
