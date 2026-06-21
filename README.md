# 🎧 Beatfinder Portugal

**Radar automático de festas e festivais de música eletrónica em Portugal.**

PWA instalável (Next.js + Supabase) para descobrir, pesquisar e guardar eventos
de música eletrónica, com painel de administração e ingestão automática via
**n8n**.

---

## ✨ Funcionalidades

**Público**
- Home com destaques, "hoje" e "fim de semana"
- Lista de eventos com filtros (cidade, data, género, preço, tipo)
- Eventos hoje · Este fim de semana · Festivais
- Mapa interativo (Leaflet, tema escuro)
- Página de detalhe do evento
- Pesquisa full-text (tolerante a acentos)
- Guardar favoritos (localStorage + sync se autenticado)
- Submeter evento (entra como *pending*)
- Instalável como app (PWA + offline básico)

**Admin** (`/admin`)
- Login (Supabase Auth)
- Aprovar / rejeitar / editar eventos
- Marcar duplicados
- Destacar eventos (pagos)
- Ver fonte original do evento
- Dashboard com contagens por estado

**Automação**
- Endpoint `POST /api/ingest` para o n8n enviar eventos (com dedupe)
- `POST /api/revalidate` para refrescar o cache

---

## 🧱 Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 14 (App Router) + React 18 |
| Estilo | Tailwind CSS (tema escuro + neon subtil) |
| Base de dados / Auth | Supabase (Postgres + RLS) |
| Mapa | Leaflet / react-leaflet |
| Validação | Zod |
| PWA | manifest + service worker próprios |

---

## 🚀 Instalação

### 1. Pré-requisitos
- Node.js 18+
- Conta Supabase (gratuita)

### 2. Instalar dependências
```bash
npm install
```

### 3. Criar o projeto Supabase e aplicar o schema
1. Cria um projeto em [supabase.com](https://supabase.com).
2. No **SQL Editor**, cola e corre o conteúdo de `supabase/schema.sql`
   (junta as 4 migrations). Em alternativa, com a CLI:
   ```bash
   npx supabase link --project-ref <ref>
   npx supabase db push
   ```
3. Cria a tua conta admin: **Authentication → Add user** (email + password).
4. Corre `scripts/make-admin.sql` (ajusta o email) para te tornares `admin`.

### 4. Variáveis de ambiente
Copia `.env.example` para `.env.local` e preenche:

```bash
cp .env.example .env.local
```

| Variável | Onde obter |
|----------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | idem |
| `SUPABASE_SERVICE_ROLE_KEY` | idem (⚠️ secreta — só servidor) |
| `INGEST_API_KEY` | inventa um segredo longo (para o n8n) |
| `REVALIDATE_SECRET` | inventa outro segredo |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` em dev |

### 5. (Opcional) Gerar tipos reais do Supabase
```bash
npm run gen:types
```

### 6. Arrancar
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000). O admin está em
[/admin/login](http://localhost:3000/admin/login).

---

## 📁 Estrutura de pastas

```
beatfinder-portugal/
├── public/
│   ├── icons/                 # ícones PWA (gerados do logo)
│   ├── manifest.webmanifest
│   └── sw.js                  # service worker
├── scripts/
│   ├── make-admin.sql
│   ├── n8n-sample-payload.json
│   └── test-ingest.sh
├── supabase/
│   ├── migrations/            # 0001_init … 0004_functions
│   ├── schema.sql             # tudo junto (correr de uma vez)
│   └── config.toml
├── docs/
│   ├── N8N.md                 # integração n8n
│   └── DEPLOY.md
└── src/
    ├── app/
    │   ├── (public)/          # rotas públicas
    │   │   ├── page.tsx            # Home
    │   │   ├── eventos/           # lista + [slug] detalhe
    │   │   ├── hoje/
    │   │   ├── fim-de-semana/
    │   │   ├── festivais/
    │   │   ├── mapa/
    │   │   ├── pesquisa/
    │   │   ├── favoritos/
    │   │   └── submeter/
    │   ├── admin/             # painel (login, dashboard, editar)
    │   ├── api/
    │   │   ├── ingest/        # n8n → eventos
    │   │   └── revalidate/
    │   ├── offline/
    │   ├── layout.tsx
    │   └── globals.css
    ├── components/            # layout, events, admin, ui
    ├── hooks/
    ├── lib/
    │   ├── supabase/          # client, server, admin, middleware
    │   ├── queries.ts
    │   ├── validation.ts      # schemas Zod
    │   ├── dates.ts · utils.ts · constants.ts
    ├── types/database.types.ts
    └── middleware.ts          # protege /admin + renova sessão
```

---

## 🗄️ Base de dados

Tabelas: `profiles`, `genres`, `venues`, `organizers`, `events`,
`event_sources`, `event_source_links`, `featured_events`, `favorites`,
`alerts`. Mais a view `events_public` (só eventos aprovados, com joins) e as
funções RPC `search_events`, `toggle_favorite`, `is_admin`.

**RLS** ativo em todas as tabelas: o público só lê eventos `approved`; qualquer
um pode submeter (`pending`); só `admin`/`moderator` aprova e edita.

Estados de evento: `pending` · `approved` · `rejected` · `duplicate`.

---

## 🤖 n8n

Ver [`docs/N8N.md`](docs/N8N.md). Em resumo, o n8n faz `POST /api/ingest` com
header `x-api-key` e o payload de `scripts/n8n-sample-payload.json`. Eventos
entram como `pending` e fazem dedupe por `(source_url, external_id)`.

Testar localmente:
```bash
INGEST_API_KEY=<o-teu-segredo> ./scripts/test-ingest.sh
```

---

## 📲 PWA

`manifest.webmanifest` + `sw.js` (network-first nas navegações, offline
fallback). Os ícones em `public/icons/` foram gerados a partir do teu logo.
O botão de instalação aparece automaticamente em browsers compatíveis.

> ⚠️ O service worker só regista em **produção** (`npm run build && npm start`)
> ou HTTPS — em `npm run dev` está desativado para evitar cache.

---

## ☁️ Deploy

Ver [`docs/DEPLOY.md`](docs/DEPLOY.md) (Vercel / Netlify).

---

## 📜 Scripts

```bash
npm run dev          # desenvolvimento
npm run build        # build de produção
npm run start        # servir produção (testar PWA)
npm run lint         # eslint
npm run type-check   # typescript
npm run gen:types    # gerar tipos do Supabase
```
