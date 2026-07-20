# Consumatore

Frontend Nuxt 3 do **Sistema de Pedidos**, integrado à API [Il Cameriere](../cameriere).

## Stack

- Nuxt 3 + Vue 3 + TypeScript
- Pinia (auth + carrinho)
- Tailwind CSS
- Camada de **services** (`app/services`) sobre o cliente HTTP (`useApi`)

## Pré-requisitos

1. API Cameriere acessível (local `http://localhost:8080` ou URL do Railway)
2. Node.js 20+

## Setup local

```bash
npm install
cp .env.example .env
npm run dev
```

App em `http://localhost:3000`.

## Estrutura de API no frontend

| Camada | Responsabilidade |
|--------|------------------|
| `composables/useApi.ts` | Cliente HTTP (base URL, JWT, erros 401) |
| `services/*Service.ts` | Endpoints por domínio (clientes, pedidos, …) |
| `pages` / `composables` | UI e fluxo; chamam services, não URLs cruas |

## Variáveis de ambiente

| Variável | Descrição |
|----------|-----------|
| `NUXT_PUBLIC_API_BASE` | URL base da API Cameriere (sem barra no final) |

Local (`.env`):

```env
NUXT_PUBLIC_API_BASE=http://localhost:8080
```

## Deploy

### Frontend → Vercel

1. Suba este repositório no GitHub/GitLab e importe o projeto na Vercel.
2. Framework: **Nuxt.js** (detectado automaticamente; ver `vercel.json`).
3. Em **Environment Variables**, defina:

   - `NUXT_PUBLIC_API_BASE` = URL pública da API no Railway  
     Ex.: `https://cameriere-production.up.railway.app`

4. Deploy. O Nitro usa o preset `vercel`.

> `NUXT_PUBLIC_*` é embutida no build do cliente. Após alterar a variável, faça um **novo deploy**.

### API → Railway (`cameriere`)

Configure no serviço Spring Boot:

| Variável | Exemplo / notas |
|----------|-----------------|
| `PORT` | Injetada pelo Railway |
| `SPRING_PROFILES_ACTIVE` | `prod` |
| `DB_URL` | JDBC MySQL/Postgres do Railway |
| `DB_USERNAME` / `DB_PASSWORD` | Credenciais do banco |
| `JWT_SECRET` | Segredo forte (≥ 256 bits) |
| `CORS_ALLOWED_ORIGINS` | Origem(ns) do frontend Vercel, ex. `https://seu-app.vercel.app` (vírgula se várias). Inclua `http://localhost:3000` se testar local contra API remota. |

A API já escuta `server.port=${PORT:8080}` e lê CORS de `cameriere.cors.allowed-origins`.

## Git

- Não versionar `.env` (já está no `.gitignore`).
- Versionar `.env.example` e este README.

```bash
git add .
git status   # conferir que .env não entra
git commit -m "Prepare frontend for Vercel and API services layer"
git push
```

## Usuários de seed (API local)

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Admin | `admin@cafeteriacentral.com` | `123456` |
| Operador | `operador@cafeteriacentral.com` | `123456` |

(Em bases já existentes, use os usuários reais cadastrados.)
