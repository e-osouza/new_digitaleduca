# Digital Educa — Plataforma do aluno

Front-end web da plataforma de conteúdos por assinatura, consumindo a API de
produção em `api.digitaleduca.com.vc`.

Next.js 16 (App Router + Turbopack) · React 19 · TypeScript · Tailwind CSS 4

## Rodando

```bash
cp .env.example .env.local   # já aponta para a API de produção
npm install
npm run dev                  # http://localhost:3000
```

| Variável | Uso |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base da API. É pública porque o loader do `next/image` monta as URLs do proxy `/img` no browser. |

## Decisões de arquitetura

### A sessão nunca chega ao JavaScript

A API autentica com JWT em header. Em vez de guardar o token no `localStorage`,
o Next age como **proxy**: o token vive num cookie `httpOnly` e todas as
chamadas autenticadas saem do servidor.

```
browser → route handler (/api/*) → API DigitalEduca
           ↑ lê o cookie httpOnly
```

- [`src/lib/session.ts`](src/lib/session.ts) — leitura e gravação do cookie
- [`src/lib/api.ts`](src/lib/api.ts) — cliente HTTP `server-only` que anexa o Bearer
- [`src/lib/queries.ts`](src/lib/queries.ts) — uma função por endpoint, tipada
- [`src/proxy.ts`](src/proxy.ts) — redireciona rotas protegidas para `/entrar?proximo=…`

O que isso compra: XSS não alcança o token, e Server Components conseguem
renderizar páginas autenticadas direto no servidor — necessário porque
`GET /conteudos/{id}` exige JWT.

Route handlers expostos ao browser:

| Rota | Faz |
| --- | --- |
| `POST /api/auth/login` | autentica e grava o cookie |
| `POST /api/auth/cadastro` | cria a conta e já faz login |
| `POST /api/auth/logout` | apaga o cookie |
| `GET /api/video/[vimeoId]/link` | devolve a URL HLS sem expor o token |
| `POST /api/progresso` | repassa os pings do player |

### Imagens pela própria API

A API já tem um proxy de otimização (`GET /img?src=&w=&q=`) que devolve WebP
redimensionado. Ele está ligado como loader customizado do `next/image` em
[`src/lib/image-loader.ts`](src/lib/image-loader.ts) — nenhuma imagem é
reprocessada aqui.

### Player

[`src/components/player.tsx`](src/components/player.tsx) busca o `.m3u8` pelo
route handler e reproduz com `hls.js` (Safari usa o suporte nativo). Retoma de
onde parou e envia progresso a cada 15 s, ao pausar, ao terminar e ao sair da
página (`keepalive`).

### Identidade visual

Navy `#05182D` com dourado `#E0A027` — a paleta já usada pelo app mobile e pelo
painel. Tema escuro único, por decisão: é uma vitrine de vídeo e a marca já é
escura. Tokens em [`src/app/globals.css`](src/app/globals.css).

## O que está pronto

Autenticação (entrar, cadastro, sair) · home com herói, destaques, top 10,
árvore de gratuitos e vitrine de instrutores · detalhe do conteúdo com aulas,
instrutores e relacionados · player com progresso · busca com filtro por tipo ·
continuar assistindo.

## O que ainda não está

- **Checkout de assinatura.** Antes de construir é preciso definir o gateway: a
  API tem campos de Stripe nos planos, mas `POST /assinatura` espera `cardToken`
  do Mercado Pago e o webhook é `/webhook/mercadopago`.
- **Trilhas.** Os três DTOs (`CreateAutoTrailDto`, `CreateManualTrailDto`,
  `UpdateTrailProgressDto`) estão vazios na spec OpenAPI — sem contrato não dá
  para integrar.
- **Verificação de e-mail e recuperação de senha.** Endpoints existem
  (`/auth/email/*`, `/reset-password/*`); as telas não.
- **Minha lista** (`/conteudos-selecionados`) e **avaliação de vídeos**.

### Um ponto que depende do backend

O ID do Vimeo de cada aula é lido de `GET /video/{id}`, com fallback para o
`videoIntrodutorio` do conteúdo. Esse endpoint exige autenticação e não foi
possível verificar o formato do campo `url` numa conta real — vale conferir na
primeira sessão logada.

## Documentação

| Arquivo | Conteúdo |
| --- | --- |
| [docs/API.md](docs/API.md) | referência dos 102 endpoints, convenções e divergências da spec |
| [docs/openapi.json](docs/openapi.json) | spec OpenAPI bruta |
| [docs/INFRA.md](docs/INFRA.md) | infraestrutura do servidor |
| [docs/SEGURANCA.md](docs/SEGURANCA.md) | auditoria de segurança |
| [docs/FORENSE-09-08.md](docs/FORENSE-09-08.md) | análise do acesso de 09/08 |
| [docs/relatorio-completo.html](docs/relatorio-completo.html) | relatório consolidado |
