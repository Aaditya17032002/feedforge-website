# FeedForge Portal

Marketing site for **FeedForge** — AI-optimized product feeds for Google, Meta, and marketplaces.

**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts.

The portal is independent of the Application (app) stack. Static pages always work. Contact, demo, Try Your Product, and the chatbot need the env vars below.

---

## Table of contents

1. [Prerequisites](#prerequisites)
2. [Local setup](#local-setup)
3. [Environment variables](#environment-variables)
4. [Optional services](#optional-services)
5. [Scripts](#scripts)
6. [Docker (local)](#docker-local)
7. [Production](#production)
8. [Project structure](#project-structure)
9. [License](#license)

---

## Prerequisites

- **Node.js 18+** (same as the production Docker image)
- **npm** (`package-lock.json`)
- Optional: **Docker** + Compose for containerized local or prod
- Optional: running **Application** backend if you need contact/demo forms

---

## Local setup

### 1. Install

```bash
npm install
```

### 2. Env file

```bash
cp .env.example .env.local
```

Next.js loads `.env.local` automatically. Do not commit it.

Minimum for a working homepage: leave placeholders as-is and start the server. Fill keys only for the features you need (see [Optional services](#optional-services)).

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Restart the dev server after changing `.env.local`.

---

## Environment variables

| File | Used for |
| ---- | -------- |
| [`.env.example`](.env.example) | Template → copy to `.env.local` |
| [`.env.prod.example`](.env.prod.example) | Template → copy to `.env.prod` on the server |
| `.env.local` / `.env` / `.env.prod` | Real secrets (gitignored) |

### Site and app links

| Variable | Local | Production | Purpose |
| -------- | ----- | ---------- | ------- |
| `APP_URL` | `http://localhost:3000` | Public site URL | Links in emails enqueued via Application |
| `NEXT_PUBLIC_APP_URL` | App host | `https://app.feedforge.ai` | Header Log in / Sign up. Baked in at **build** time |

### Application backend (contact + demo forms)

Must match Application `.env` / `.env.prod`. The browser never sees the API key.

| Variable | Local | Production | Purpose |
| -------- | ----- | ---------- | ------- |
| `LANDING_PORTAL_API_KEY` | Same secret as Application | Same | Header `X-Landing-Api-Key` |
| `BACKEND_API_URL` | `http://localhost:8000` | unused | `npm run dev` when Application is on the host |
| `BACKEND_INTERNAL_URL` | empty (or `http://host.docker.internal:8000` in Docker) | `http://feedforge_backend:8000` | Server-side URL to Application |

Contact and demo: `POST /api/v1/leads`, then `POST /api/v1/email/enqueue`. SendGrid lives on Application only.

### OpenRouter (Try Your Product + chatbot)

Paid credits required. Default model: `google/gemini-2.5-flash-lite` (same as Application).

| Variable | Purpose |
| -------- | ------- |
| `OPENROUTER_API_KEY` | [OpenRouter](https://openrouter.ai/) key with credits |
| `OPENROUTER_MODEL` | Model id |
| `NEXT_PUBLIC_CHATBOT_ENABLED` | `true` to show the widget. Baked in at **build** time |
| `OPENROUTER_BASE_URL` | Optional. Default `https://openrouter.ai/api/v1` |

### Cal.com (chatbot scheduling)

| Variable | Purpose |
| -------- | ------- |
| `CAL_API_KEY` | Cal.com API key |
| `CAL_USERNAME` | Cal username |
| `CAL_EVENT_TYPE_ID` | Event type id |
| `CAL_TIMEZONE` | Default `UTC` |

### Analytics

| Variable | Local | Production | Purpose |
| -------- | ----- | ---------- | ------- |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Omit to disable | Set in GitHub Actions **and** `.env.prod` | GA4. Baked in at **build** time |
| `GA_MEASUREMENT_ID` | unused | Same measurement id | Read at **container runtime** |

### Optional

| Variable | Purpose |
| -------- | ------- |
| `DOCS_URL` | Docs link in emails. Defaults to `${APP_URL}/docs` |

---

## Optional services

Do these only if you need the feature. The rest of the site still runs.

**Try Your Product / chatbot**

1. Create an OpenRouter key and add credits.
2. Set `OPENROUTER_API_KEY` and keep `OPENROUTER_MODEL=google/gemini-2.5-flash-lite`.
3. Set `NEXT_PUBLIC_CHATBOT_ENABLED=true` to show the widget (restart / rebuild).

**Contact / demo forms**

1. Start Application on port 8000.
2. Set `LANDING_PORTAL_API_KEY` to the same value as Application.
3. Local npm: `BACKEND_API_URL=http://localhost:8000`.

**Chatbot booking**

Set the four `CAL_*` variables from your Cal.com event type.

**GA4**

Set `NEXT_PUBLIC_GA_MEASUREMENT_ID` (and `GA_MEASUREMENT_ID` in prod).

---

## Scripts

| Command | Description |
| ------- | ----------- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |

---

## Docker (local)

Hot reload on [http://localhost:3000](http://localhost:3000). Uses `.env.local`. Application is reached via `host.docker.internal:8000` (no shared Docker network required).

```bash
docker compose --env-file .env.local -f docker-compose.dev.yml up --build
```

---

## Production

Images are built by GitHub Actions on push to `main` and pushed to Docker Hub as `sonishivam1402/feedforge-website` (`:latest` and `:<short-sha>`). The server **pulls** the image — do not `--build` on the server.

`NEXT_PUBLIC_*` is baked in at CI build time. Runtime secrets stay in server `.env.prod`.

### GitHub Actions (Settings → Secrets and variables → Actions)

| Name | Type | Purpose |
| ---- | ---- | ------- |
| `DOCKERHUB_USERNAME` | secret | Docker Hub user |
| `DOCKERHUB_TOKEN` | secret | Docker Hub token |
| `NEXT_PUBLIC_CHATBOT_ENABLED` | variable | Client bundle |
| `NEXT_PUBLIC_APP_URL` | variable | e.g. `https://app.feedforge.ai` |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | variable | GA4 |

### Server

Needs `edge_net` and a running Application backend.

```bash
cp .env.prod.example .env.prod
# Edit .env.prod — LANDING_PORTAL_API_KEY must match Application
# docker login   # if the Hub repo is private
docker compose --env-file .env.prod -f docker-compose.prod.yml pull
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
```

The portal container calls Application at `http://feedforge_backend:8000`. Public HTTP is via the edge proxy.

---

## Project structure

| Path | What |
| ---- | ---- |
| `app/(marketing)/` | Public pages: `/`, `/pricing`, `/faqs`, `/contact`, `/products`, `/customers` |
| `app/api/` | `contact`, `demo-request`, `try-product`, `chat` |
| `components/` | UI by feature (`layout/`, `home/`, `forms/`, `chatbot/`, …) |
| `lib/ai/` | OpenRouter: try-product + chatbot |
| `lib/server/` | Cal.com, Application leads/email, API helpers |
| `public/` | Static assets |

---

## License

Private package (`"private": true` in `package.json`).
