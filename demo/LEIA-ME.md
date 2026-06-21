# Beatfinder Portugal — Demo HTML

Protótipo visual num único ficheiro (`index.html`). Mostra o design e a
navegação da app com **eventos de exemplo**. Não usa Supabase nem n8n — serve
para veres o aspeto e o fluxo.

## Abrir (ver rápido)
Faz **duplo-clique** em `index.html`. Abre no browser e podes navegar por:
Início, Eventos (com filtros), Hoje, Fim de semana, Festivais, Mapa, Pesquisa,
Favoritos, Submeter e Detalhe do evento.

> Aberto assim (file://), o **mapa** precisa de internet e a **instalação PWA
> não funciona** — isso é uma limitação dos browsers, não da app.

## Instalar como PWA (a sério)
Os browsers só deixam instalar uma PWA quando servida por http(s)/localhost.
Numa pasta com este ficheiro, corre **um** destes comandos e abre o endereço
indicado:

```bash
# opção 1 (Node)
npx serve .

# opção 2 (Python)
python -m http.server 8080
```

Depois abre `http://localhost:8080` (ou o porto mostrado). Vai aparecer o botão
**Instalar** (ou o ícone de instalação na barra do browser). No telemóvel:
menu → "Adicionar ao ecrã principal".

## E a app real?
A versão completa e funcional (com base de dados, login admin, ingestão n8n)
é o projeto **Next.js** na pasta principal — ver o `README.md` do projeto.
