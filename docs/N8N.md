# Integração com n8n

O Beatfinder recebe eventos automaticamente através do endpoint
`POST /api/ingest`. O n8n faz o scraping/normalização e envia o resultado.

## Autenticação
Header obrigatório:

```
x-api-key: <INGEST_API_KEY>
```

(ou `Authorization: Bearer <INGEST_API_KEY>`). O valor tem de ser igual ao
`INGEST_API_KEY` definido no `.env.local`/produção.

## Formato do payload
Aceita um único evento `{...}` ou um lote `{ "events": [ {...}, {...} ] }`.
Ver `scripts/n8n-sample-payload.json`.

Campos:

| Campo | Tipo | Notas |
|-------|------|-------|
| `title` | string | obrigatório |
| `date_start` | string (ISO) | obrigatório |
| `date_end` | string\|null | |
| `city`, `country` | string | country default "Portugal" |
| `venue_name`, `venue_address` | string | cria venue se vier |
| `organizer_name` | string | cria organizer se vier |
| `genre` | string | slug ou nome (ex: "techno") |
| `event_type` | enum | club\|festival\|open_air\|rave\|showcase\|boat\|other |
| `is_festival` | bool | |
| `price_min`, `price_max` | number | |
| `ticket_url`, `source_url`, `image_url` | string | |
| `latitude`, `longitude` | number | para o mapa |
| `external_id` | string | id na fonte → **dedupe** |
| `confidence_score` | number 0..1 | confiança do scraper |
| `raw_payload` | object | payload original (debug) |

## Deduplicação
Quando envias `external_id` **e** `source_url`, o sistema faz *upsert* por
`(source_url, external_id)` — reenviar o mesmo evento atualiza-o em vez de
duplicar.

Todos os eventos entram com `status = 'pending'` e ficam à espera de
aprovação no painel admin (`/admin`).

## Fluxo recomendado no n8n
1. **Cron** (ex: cada 6h) → dispara o workflow.
2. **HTTP Request / scraping** das fontes (RA, Instagram, sites de salas).
3. **Function / Set** → mapeia para o formato acima.
4. **HTTP Request** `POST {SITE}/api/ingest` com header `x-api-key`.
5. (Opcional) `POST {SITE}/api/revalidate?secret=REVALIDATE_SECRET` para
   refrescar o cache.

## Resposta
```json
{ "received": 1, "inserted": 1, "results": [{ "title": "...", "status": "ok" }] }
```
