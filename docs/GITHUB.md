# Publicar no GitHub

O projeto já está limpo e pronto: `README.md`, `.gitignore` (ignora `.env` e
`node_modules`), logo em `assets/` e sem chaves no código.

> ⚠️ **Antes de começar:** apaga a pasta `.git` que ficou meia-criada nesta
> pasta. No Explorador do Windows ativa "Itens ocultos", apaga a pasta `.git`,
> ou no terminal dentro da pasta do projeto corre:
> ```powershell
> Remove-Item -Recurse -Force .git
> ```

---

## Opção A — Linha de comandos (recomendado, liga logo à Vercel)

Pré-requisito: ter o [Git](https://git-scm.com/download/win) instalado.

1. Cria o repositório vazio em [github.com/new](https://github.com/new)
   (nome sugerido: `beatfinder-portugal`). **Não** marques "Add a README".
2. No terminal, dentro da pasta do projeto:

```bash
git init
git add .
git commit -m "Beatfinder Portugal — base inicial"
git branch -M main
git remote add origin https://github.com/O-TEU-USER/beatfinder-portugal.git
git push -u origin main
```

---

## Opção B — Pelo site (sem instalar nada)

1. [github.com/new](https://github.com/new) → nome `beatfinder-portugal` → Create.
2. Na página do repo → "uploading an existing file".
3. Arrasta **todo o conteúdo** da pasta do projeto (menos a pasta `.git`).
4. "Commit changes".

> A pasta `node_modules` não existe ainda (só aparece depois de `npm install`),
> por isso não há nada pesado para carregar.

---

## A seguir: Vercel

1. [vercel.com](https://vercel.com) → faz login **com o GitHub**.
2. Add New → Project → importa o `beatfinder-portugal`. Deteta o Next.js sozinho.
3. **Settings → Environment Variables** — adiciona as 6 (ver `.env.example`):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
   `SUPABASE_SERVICE_ROLE_KEY`, `INGEST_API_KEY`, `REVALIDATE_SECRET`,
   `NEXT_PUBLIC_SITE_URL` (o domínio que a Vercel der).
4. Deploy. Fica em HTTPS e a PWA passa a instalar.

> Sempre que fizeres `git push`, a Vercel faz redeploy automático.
