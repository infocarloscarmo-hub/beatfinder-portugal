# Deploy

## Vercel (recomendado para Next.js)
1. `git push` para um repositório GitHub.
2. Importa o repo em vercel.com → New Project.
3. Define as variáveis de ambiente (ver `.env.example`).
4. Deploy. ISR e API routes funcionam out-of-the-box.

## Netlify
1. New site from Git.
2. Build command `next build`, usa o plugin oficial `@netlify/plugin-nextjs`.
3. Define as variáveis de ambiente.

## Variáveis necessárias em produção
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`  (secreta!)
- `INGEST_API_KEY`            (secreta!)
- `REVALIDATE_SECRET`         (secreta!)
- `NEXT_PUBLIC_SITE_URL`      (ex: https://beatfinder.pt)

> A PWA só instala em **HTTPS** (ou localhost). Em produção fica automático.
